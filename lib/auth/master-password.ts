import "server-only";

import { randomBytes } from "node:crypto";

import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db/prisma";

import { MIN_MASTER_PASSWORD_LENGTH, validateMasterPasswordInput } from "./password-policy";

const BCRYPT_ROUNDS = 12;
const KDF_ITERATIONS = 210_000;

export type LockFlowState = {
  hasVault: boolean;
};

export type UnlockVerificationResult =
  | {
      ok: true;
      vaultId: string;
      keyDerivationSalt: string;
      keyDerivationIterations: number;
      keyDerivationHash: string;
      encryptionKeyVersion: number;
    }
  | {
      ok: false;
      errorKey: string;
    };

export type MasterPasswordRotationInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  newKeyDerivationSalt: string;
  newKeyDerivationIterations: number;
  rotatedCredentials: Array<{
    id: string;
    usernameEncrypted: string;
    passwordEncrypted: string;
    notesEncrypted?: string | null;
  }>;
};

const databaseErrorCodes = new Set([
  "P1000",
  "P1001",
  "P1003",
  "P1010",
  "P1017",
  "P2021",
]);

function isDatabaseUnavailableError(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return databaseErrorCodes.has(error.code);
  }

  return false;
}

export async function getLockFlowState(): Promise<LockFlowState> {
  try {
    const vault = await prisma.vault.findFirst({
      select: { id: true, masterPasswordHash: true },
      orderBy: { createdAt: "asc" },
    });

    return { hasVault: Boolean(vault?.masterPasswordHash) };
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return {
        hasVault: false,
      };
    }

    throw error;
  }
}

function buildTeamSlug() {
  return `team-${randomBytes(4).toString("hex")}`;
}

export async function createInitialMasterPassword(masterPassword: string, confirmPassword: string) {
  const fieldErrors = validateMasterPasswordInput(masterPassword, confirmPassword);
  if (fieldErrors.password || fieldErrors.confirmPassword) {
    return {
      ok: false as const,
      errorKey: "lock.errors.invalidInput",
      fieldErrors,
    };
  }

  try {
    const existingVault = await prisma.vault.findFirst({
      select: { id: true, masterPasswordHash: true },
      orderBy: { createdAt: "asc" },
    });

    if (existingVault?.masterPasswordHash) {
      return {
        ok: false as const,
        errorKey: "lock.errors.alreadyInitialized",
        fieldErrors: {},
      };
    }

    const masterPasswordHash = await bcrypt.hash(masterPassword, BCRYPT_ROUNDS);
    const keyDerivationSalt = randomBytes(16).toString("base64");

    const createdVault = await prisma.$transaction(async (tx) => {
      if (existingVault) {
        return tx.vault.update({
          where: { id: existingVault.id },
          data: {
            masterPasswordHash,
            masterPasswordAlgo: "bcrypt",
            keyDerivationSalt,
            keyDerivationIterations: KDF_ITERATIONS,
            keyDerivationHash: "SHA-256",
            encryptionKeyVersion: 1,
          },
          select: {
            id: true,
            keyDerivationSalt: true,
            keyDerivationIterations: true,
            keyDerivationHash: true,
            encryptionKeyVersion: true,
          },
        });
      }

      const team = await tx.team.create({
        data: {
          name: "Primary Team",
          slug: buildTeamSlug(),
        },
        select: { id: true },
      });

      return tx.vault.create({
        data: {
          teamId: team.id,
          name: "Primary Vault",
          slug: "primary",
          masterPasswordHash,
          masterPasswordAlgo: "bcrypt",
          keyDerivationSalt,
          keyDerivationIterations: KDF_ITERATIONS,
          keyDerivationHash: "SHA-256",
          encryptionKeyVersion: 1,
        },
        select: {
          id: true,
          keyDerivationSalt: true,
          keyDerivationIterations: true,
          keyDerivationHash: true,
          encryptionKeyVersion: true,
        },
      });
    });

    if (!createdVault.keyDerivationSalt) {
      return {
        ok: false as const,
        errorKey: "lock.errors.unexpected",
        fieldErrors: {},
      };
    }

    return {
      ok: true as const,
      vaultId: createdVault.id,
      keyDerivationSalt: createdVault.keyDerivationSalt,
      keyDerivationIterations: createdVault.keyDerivationIterations,
      keyDerivationHash: createdVault.keyDerivationHash,
      encryptionKeyVersion: createdVault.encryptionKeyVersion,
    };
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return {
        ok: false as const,
        errorKey: "lock.errors.databaseUnavailable",
        fieldErrors: {},
      };
    }

    throw error;
  }
}

export async function verifyMasterPassword(masterPassword: string): Promise<UnlockVerificationResult> {
  if (!masterPassword || masterPassword.length < MIN_MASTER_PASSWORD_LENGTH) {
    return {
      ok: false,
      errorKey: "lock.errors.invalidCredentials",
    };
  }

  try {
    const vault = await prisma.vault.findFirst({
      select: {
        id: true,
        masterPasswordHash: true,
        keyDerivationSalt: true,
        keyDerivationIterations: true,
        keyDerivationHash: true,
        encryptionKeyVersion: true,
      },
      where: {
        masterPasswordHash: {
          not: null,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    if (!vault || !vault.masterPasswordHash || !vault.keyDerivationSalt) {
      return {
        ok: false,
        errorKey: "lock.errors.setupRequired",
      };
    }

    const isValid = await bcrypt.compare(masterPassword, vault.masterPasswordHash);

    if (!isValid) {
      return {
        ok: false,
        errorKey: "lock.errors.invalidCredentials",
      };
    }

    return {
      ok: true,
      vaultId: vault.id,
      keyDerivationSalt: vault.keyDerivationSalt,
      keyDerivationIterations: vault.keyDerivationIterations,
      keyDerivationHash: vault.keyDerivationHash,
      encryptionKeyVersion: vault.encryptionKeyVersion,
    };
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return {
        ok: false,
        errorKey: "lock.errors.databaseUnavailable",
      };
    }

    throw error;
  }
}

export async function rotateMasterPassword(input: MasterPasswordRotationInput) {
  const fieldErrors = validateMasterPasswordInput(input.newPassword, input.confirmPassword);
  if (fieldErrors.password || fieldErrors.confirmPassword) {
    return {
      ok: false as const,
      errorKey: "settings.security.masterPassword.errors.invalidInput",
      fieldErrors,
    };
  }

  if (!input.currentPassword) {
    return {
      ok: false as const,
      errorKey: "settings.security.masterPassword.errors.currentRequired",
      fieldErrors: {},
    };
  }

  if (!input.newKeyDerivationSalt || input.newKeyDerivationIterations < 100_000) {
    return {
      ok: false as const,
      errorKey: "settings.security.masterPassword.errors.invalidRotationData",
      fieldErrors: {},
    };
  }

  try {
    const vault = await prisma.vault.findFirst({
      select: {
        id: true,
        masterPasswordHash: true,
        encryptionKeyVersion: true,
      },
      where: {
        masterPasswordHash: {
          not: null,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    if (!vault?.masterPasswordHash) {
      return {
        ok: false as const,
        errorKey: "lock.errors.setupRequired",
        fieldErrors: {},
      };
    }

    const currentValid = await bcrypt.compare(input.currentPassword, vault.masterPasswordHash);

    if (!currentValid) {
      return {
        ok: false as const,
        errorKey: "settings.security.masterPassword.errors.currentInvalid",
        fieldErrors: {},
      };
    }

    const existingCredentials = await prisma.credential.findMany({
      where: { vaultId: vault.id, isArchived: false },
      select: { id: true },
    });

    if (existingCredentials.length !== input.rotatedCredentials.length) {
      return {
        ok: false as const,
        errorKey: "settings.security.masterPassword.errors.rotationDataMismatch",
        fieldErrors: {},
      };
    }

    const existingIds = new Set(existingCredentials.map((item) => item.id));
    const rotatedIds = new Set(input.rotatedCredentials.map((item) => item.id));

    if (existingIds.size !== rotatedIds.size || [...existingIds].some((id) => !rotatedIds.has(id))) {
      return {
        ok: false as const,
        errorKey: "settings.security.masterPassword.errors.rotationDataMismatch",
        fieldErrors: {},
      };
    }

    const nextHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
    const nextKeyVersion = vault.encryptionKeyVersion + 1;

    await prisma.$transaction(async (tx) => {
      await Promise.all(
        input.rotatedCredentials.map((item) =>
          tx.credential.update({
            where: { id: item.id },
            data: {
              usernameEncrypted: item.usernameEncrypted,
              passwordEncrypted: item.passwordEncrypted,
              notesEncrypted: item.notesEncrypted ?? null,
              encryptionAlgorithm: "AES_256_GCM",
              encryptionKeyVersion: nextKeyVersion,
            },
          }),
        ),
      );

      await tx.vault.update({
        where: { id: vault.id },
        data: {
          masterPasswordHash: nextHash,
          masterPasswordAlgo: "bcrypt",
          keyDerivationSalt: input.newKeyDerivationSalt,
          keyDerivationIterations: input.newKeyDerivationIterations,
          keyDerivationHash: "SHA-256",
          encryptionKeyVersion: nextKeyVersion,
        },
      });
    });

    return {
      ok: true as const,
      vaultId: vault.id,
      keyDerivationSalt: input.newKeyDerivationSalt,
      keyDerivationIterations: input.newKeyDerivationIterations,
      keyDerivationHash: "SHA-256",
      encryptionKeyVersion: nextKeyVersion,
    };
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return {
        ok: false as const,
        errorKey: "lock.errors.databaseUnavailable",
        fieldErrors: {},
      };
    }

    throw error;
  }
}
