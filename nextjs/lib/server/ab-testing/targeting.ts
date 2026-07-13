export type ExperimentTargeting = {
  targetCountries: string[];
  targetLocales: string[];
  targetPlatforms: string[];
  targetOsVersions: unknown;
};

export type DeviceContext = {
  countryCode: string | null;
  locale: string | null;
  platform: string | null;
  osVersion: string | null;
};

type OsRange = { min?: string; max?: string };

export function normalizeDeviceContext(input: Partial<DeviceContext>): DeviceContext {
  return {
    countryCode: input.countryCode?.trim().toUpperCase().slice(0, 5) || null,
    locale: input.locale?.trim().toLowerCase().replaceAll("_", "-").slice(0, 20) || null,
    platform: input.platform?.trim().toLowerCase().slice(0, 20) || null,
    osVersion: input.osVersion?.trim().slice(0, 30) || null,
  };
}

function compareVersions(left: string, right: string) {
  const a = left.split(/[.-]/).map((part) => Number.parseInt(part, 10) || 0);
  const b = right.split(/[.-]/).map((part) => Number.parseInt(part, 10) || 0);
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    const difference = (a[index] || 0) - (b[index] || 0);
    if (difference !== 0) return difference;
  }
  return 0;
}

export function isDeviceEligible(targeting: ExperimentTargeting, context: DeviceContext) {
  const countries = targeting.targetCountries.map((value) => value.toUpperCase());
  if (countries.length > 0 && (!context.countryCode || !countries.includes(context.countryCode))) return false;

  const locales = targeting.targetLocales.map((value) => value.toLowerCase().replaceAll("_", "-"));
  const locale = context.locale;
  if (locales.length > 0 && (!locale || !locales.some((value) => locale === value || locale.startsWith(`${value}-`)))) return false;

  const platforms = targeting.targetPlatforms.map((value) => value.toLowerCase());
  if (platforms.length > 0 && (!context.platform || !platforms.includes(context.platform))) return false;

  const ranges = targeting.targetOsVersions && typeof targeting.targetOsVersions === "object"
    ? targeting.targetOsVersions as Record<string, OsRange>
    : {};
  if (context.platform && ranges[context.platform]) {
    if (!context.osVersion) return false;
    const range = ranges[context.platform];
    if (range.min && compareVersions(context.osVersion, range.min) < 0) return false;
    if (range.max && compareVersions(context.osVersion, range.max) > 0) return false;
  }

  return true;
}
