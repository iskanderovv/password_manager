export type DerivedVaultKey = {
  key: CryptoKey;
  keyDerivationSalt: string;
  keyDerivationIterations: number;
  keyDerivationHash: "SHA-256";
};

export type EncryptedPayload = {
  iv: string;
  ciphertext: string;
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);

  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }

  return btoa(binary);
}

function base64ToUint8Array(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

export async function deriveKey(
  masterPassword: string,
  options: {
    keyDerivationSalt: string;
    keyDerivationIterations: number;
  },
): Promise<DerivedVaultKey> {
  const saltBytes = base64ToUint8Array(options.keyDerivationSalt);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(masterPassword),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: saltBytes,
      iterations: options.keyDerivationIterations,
    },
    keyMaterial,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"],
  );

  return {
    key,
    keyDerivationSalt: options.keyDerivationSalt,
    keyDerivationIterations: options.keyDerivationIterations,
    keyDerivationHash: "SHA-256",
  };
}

export async function encrypt(data: string, key: CryptoKey): Promise<EncryptedPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    textEncoder.encode(data),
  );

  return {
    iv: arrayBufferToBase64(iv.buffer),
    ciphertext: arrayBufferToBase64(encrypted),
  };
}

export async function decrypt(payload: EncryptedPayload, key: CryptoKey): Promise<string> {
  const iv = base64ToUint8Array(payload.iv);
  const ciphertext = base64ToUint8Array(payload.ciphertext);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext,
  );

  return textDecoder.decode(decrypted);
}
