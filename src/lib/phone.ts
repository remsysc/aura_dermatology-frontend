/**
 * Normalises a Philippine mobile number to the API's required `+639XXXXXXXXX`
 * (regex `^\+639\d{9}$`). Accepts `0917 123 4567`, `917-123-4567`, `+63 917 123 4567`
 * and `63917…`. Returns `null` when the input cannot be a valid PH mobile number.
 */
export function normalizePhMobile(input: string): string | null {
  const digits = input.replace(/[\s\-().]/g, "");
  if (!/^\+?\d+$/.test(digits)) {
    return null;
  }
  const bare = digits.replace(/^\+/, "");

  let national: string;
  if (bare.startsWith("63")) {
    national = bare.slice(2);
  } else if (bare.startsWith("0")) {
    national = bare.slice(1);
  } else {
    national = bare;
  }

  return /^9\d{9}$/.test(national) ? `+63${national}` : null;
}

export function isValidPhMobile(input: string): boolean {
  return normalizePhMobile(input) !== null;
}
