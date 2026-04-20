export type PasswordGeneratorOptions = {
  length: number;
  uppercase: boolean;
  numbers: boolean;
  symbols: boolean;
  avoidAmbiguous: boolean;
};

export const defaultPasswordGeneratorOptions: PasswordGeneratorOptions = {
  length: 18,
  uppercase: true,
  numbers: true,
  symbols: true,
  avoidAmbiguous: true,
};

const LOWERCASE = "abcdefghijkmnopqrstuvwxyz";
const LOWERCASE_AMBIGUOUS = "l";
const UPPERCASE = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const UPPERCASE_AMBIGUOUS = "IO";
const NUMBERS = "23456789";
const NUMBERS_AMBIGUOUS = "01";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.?";

function randomIndex(max: number) {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return (bytes[0] ?? 0) % max;
}

function pick(chars: string) {
  return chars[randomIndex(chars.length)] ?? "";
}

export function generatePassword(options: PasswordGeneratorOptions) {
  const baseLower = options.avoidAmbiguous ? LOWERCASE : LOWERCASE + LOWERCASE_AMBIGUOUS;
  const baseUpper = options.avoidAmbiguous ? UPPERCASE : UPPERCASE + UPPERCASE_AMBIGUOUS;
  const baseNumbers = options.avoidAmbiguous ? NUMBERS : NUMBERS + NUMBERS_AMBIGUOUS;

  const buckets = [baseLower];
  if (options.uppercase) buckets.push(baseUpper);
  if (options.numbers) buckets.push(baseNumbers);
  if (options.symbols) buckets.push(SYMBOLS);

  const pool = buckets.join("");
  const desiredLength = Math.max(8, Math.min(64, options.length));

  const chars: string[] = [];

  for (const bucket of buckets) {
    chars.push(pick(bucket));
  }

  while (chars.length < desiredLength) {
    chars.push(pick(pool));
  }

  for (let i = chars.length - 1; i > 0; i -= 1) {
    const nextIndex = randomIndex(i + 1);
    const current = chars[i];
    chars[i] = chars[nextIndex] ?? "";
    chars[nextIndex] = current ?? "";
  }

  return chars.join("");
}
