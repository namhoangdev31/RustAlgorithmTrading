const ZERO_DECIMAL = new Set(["BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA", "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF"]);
const THREE_DECIMAL = new Set(["BHD", "JOD", "KWD", "OMR", "TND"]);

export function currencyExponent(currency: string) {
  const normalized = currency.toUpperCase();
  if (ZERO_DECIMAL.has(normalized)) return 0;
  if (THREE_DECIMAL.has(normalized)) return 3;
  return 2;
}

export function toMinorUnits(amount: number, currency: string) {
  if (!Number.isFinite(amount) || amount < 0) throw new Error("INVALID_MONEY_AMOUNT");
  return BigInt(Math.round(amount * 10 ** currencyExponent(currency)));
}

export function fromMinorUnits(amount: bigint, currency: string) {
  return Number(amount) / 10 ** currencyExponent(currency);
}
