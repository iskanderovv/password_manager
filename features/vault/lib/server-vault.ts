import "server-only";

import { prisma } from "@/lib/db/prisma";
import type {
  UpsertCredentialEncryptedInput,
  VaultCredentialRecord,
  VaultOverviewPayload,
} from "@/features/vault/types";

function normalizeTag(tag: string) {
  return tag.trim().replace(/\s+/g, " ");
}

function normalizeTags(tags: string[]) {
  const normalized = tags.map(normalizeTag).filter(Boolean);
  return Array.from(new Set(normalized)).slice(0, 12);
}

function normalizeUrl(url: string | undefined) {
  if (!url) return null;

  const value = url.trim();
  if (!value) return null;

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `https://${value}`;
}

async function resolveVaultId(vaultId?: string) {
  if (vaultId) {
    const existing = await prisma.vault.findUnique({
      where: { id: vaultId },
      select: { id: true },
    });

    return existing?.id ?? null;
  }

  const primary = await prisma.vault.findFirst({
    where: { masterPasswordHash: { not: null } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  return primary?.id ?? null;
}

export async function getActiveVaultId(vaultId?: string) {
  return resolveVaultId(vaultId);
}

function mapCredentialRecord(record: {
  id: string;
  vaultId: string;
  serviceName: string;
  serviceUrl: string | null;
  usernameEncrypted: string;
  passwordEncrypted: string;
  notesEncrypted: string | null;
  passwordStrengthScore: number | null;
  isFavorite: boolean;
  isPinned: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  tags: Array<{ tag: { name: string } }>;
}): VaultCredentialRecord {
  return {
    id: record.id,
    vaultId: record.vaultId,
    serviceName: record.serviceName,
    serviceUrl: record.serviceUrl,
    usernameEncrypted: record.usernameEncrypted,
    passwordEncrypted: record.passwordEncrypted,
    notesEncrypted: record.notesEncrypted,
    passwordStrengthScore: record.passwordStrengthScore,
    isFavorite: record.isFavorite,
    isPinned: record.isPinned,
    lastUsedAt: record.lastUsedAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    tags: record.tags.map((item) => item.tag.name),
  };
}

export async function getVaultOverviewPayload(): Promise<VaultOverviewPayload> {
  const vaultId = await resolveVaultId();

  if (!vaultId) {
    return {
      vaultId: null,
      credentials: [],
      availableTags: [],
    };
  }

  const [credentials, tags] = await Promise.all([
    prisma.credential.findMany({
      where: { vaultId, isArchived: false },
      include: {
        tags: {
          include: {
            tag: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    }),
    prisma.credentialTag.findMany({
      where: { vaultId },
      select: { name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    vaultId,
    credentials: credentials.map(mapCredentialRecord),
    availableTags: tags.map((tag) => tag.name),
  };
}

export async function getCredentialById(id: string) {
  const credential = await prisma.credential.findUnique({
    where: { id },
    include: {
      tags: {
        include: {
          tag: {
            select: { name: true },
          },
        },
      },
    },
  });

  if (!credential || credential.isArchived) {
    return null;
  }

  return mapCredentialRecord(credential);
}

export async function getAvailableTags(vaultId?: string) {
  const resolvedVaultId = await resolveVaultId(vaultId);
  if (!resolvedVaultId) return [];

  const tags = await prisma.credentialTag.findMany({
    where: { vaultId: resolvedVaultId },
    select: { name: true },
    orderBy: { name: "asc" },
  });

  return tags.map((tag) => tag.name);
}

async function ensureTagIds(vaultId: string, tags: string[]) {
  const normalizedTags = normalizeTags(tags);
  if (normalizedTags.length === 0) return [];

  const upserted = await Promise.all(
    normalizedTags.map((name) =>
      prisma.credentialTag.upsert({
        where: {
          vaultId_name: {
            vaultId,
            name,
          },
        },
        update: {},
        create: {
          vaultId,
          name,
        },
        select: { id: true },
      }),
    ),
  );

  return upserted.map((tag) => tag.id);
}

export async function createCredential(input: UpsertCredentialEncryptedInput) {
  const resolvedVaultId = await resolveVaultId(input.vaultId);
  if (!resolvedVaultId) return null;

  const tagIds = await ensureTagIds(resolvedVaultId, input.tags);

  const created = await prisma.credential.create({
    data: {
      vaultId: resolvedVaultId,
      serviceName: input.serviceName.trim(),
      serviceUrl: normalizeUrl(input.serviceUrl),
      // Sensitive fields are encrypted client-side with the in-memory vault key.
      usernameEncrypted: input.usernameEncrypted,
      passwordEncrypted: input.passwordEncrypted,
      notesEncrypted: input.notesEncrypted ?? null,
      passwordStrengthScore: input.passwordStrengthScore,
      encryptionKeyVersion: 1,
      encryptionAlgorithm: "AES_256_GCM",
      missingUrlRisk: !input.serviceUrl || !input.serviceUrl.trim(),
      isFavorite: Boolean(input.isFavorite),
      isPinned: Boolean(input.isPinned),
      lastUsedAt: input.lastUsedAt ? new Date(input.lastUsedAt) : null,
      tags: {
        create: tagIds.map((tagId) => ({
          tagId,
        })),
      },
    },
    select: { id: true },
  });

  return created.id;
}

export async function updateCredential(input: UpsertCredentialEncryptedInput) {
  if (!input.credentialId) return null;

  const existing = await prisma.credential.findUnique({
    where: { id: input.credentialId },
    select: { id: true, vaultId: true, isArchived: true },
  });

  if (!existing || existing.isArchived || existing.vaultId !== input.vaultId) {
    return null;
  }

  const tagIds = await ensureTagIds(existing.vaultId, input.tags);

  const updated = await prisma.credential.update({
    where: { id: existing.id },
    data: {
      serviceName: input.serviceName.trim(),
      serviceUrl: normalizeUrl(input.serviceUrl),
      usernameEncrypted: input.usernameEncrypted,
      passwordEncrypted: input.passwordEncrypted,
      notesEncrypted: input.notesEncrypted ?? null,
      passwordStrengthScore: input.passwordStrengthScore,
      missingUrlRisk: !input.serviceUrl || !input.serviceUrl.trim(),
      isFavorite: Boolean(input.isFavorite),
      isPinned: Boolean(input.isPinned),
      lastUsedAt: input.lastUsedAt ? new Date(input.lastUsedAt) : null,
      tags: {
        deleteMany: {},
        create: tagIds.map((tagId) => ({
          tagId,
        })),
      },
    },
    select: { id: true },
  });

  return updated.id;
}

export async function deleteCredentialById(input: { credentialId: string; vaultId: string }) {
  const deleted = await prisma.credential.deleteMany({
    where: {
      id: input.credentialId,
      vaultId: input.vaultId,
    },
  });

  return deleted.count > 0;
}

export async function setCredentialFavorite(input: {
  credentialId: string;
  vaultId: string;
  isFavorite: boolean;
}) {
  const updated = await prisma.credential.updateMany({
    where: {
      id: input.credentialId,
      vaultId: input.vaultId,
      isArchived: false,
    },
    data: {
      isFavorite: input.isFavorite,
    },
  });

  return updated.count > 0;
}
