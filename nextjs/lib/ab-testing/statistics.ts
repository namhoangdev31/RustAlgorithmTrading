export type ConfidenceInterval = { low: number; high: number };

export type BinaryExperimentResult = {
  rateA: number;
  rateB: number;
  absoluteDifference: number;
  liftPercent: number | null;
  intervalA: ConfidenceInterval;
  intervalB: ConfidenceInterval;
  differenceInterval: ConfidenceInterval;
  pValue: number | null;
  confidence: number | null;
};

export type SequentialBayesianResult = {
  sequentialEvidence: number;
  posteriorProbabilityB: number;
  expectedLossA: number;
  expectedLossB: number;
  credibleDifference: ConfidenceInterval;
};

const clampProbability = (value: number) => Math.min(1, Math.max(0, value));

function erf(value: number) {
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * x);
  const approximation = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-x * x);
  return sign * approximation;
}

export function normalCdf(value: number) {
  return 0.5 * (1 + erf(value / Math.SQRT2));
}

function normalPdf(value: number) {
  return Math.exp(-0.5 * value * value) / Math.sqrt(2 * Math.PI);
}

function logGamma(value: number): number {
  const coefficients = [
    676.5203681218851, -1259.1392167224028, 771.3234287776531,
    -176.6150291621406, 12.507343278686905, -0.13857109526572012,
    9.984369578019572e-6, 1.5056327351493116e-7,
  ];
  if (value < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * value)) - logGamma(1 - value);
  let x = 0.9999999999998099;
  const shifted = value - 1;
  for (let index = 0; index < coefficients.length; index += 1) x += coefficients[index] / (shifted + index + 1);
  const t = shifted + coefficients.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (shifted + 0.5) * Math.log(t) - t + Math.log(x);
}

function logBeta(a: number, b: number) {
  return logGamma(a) + logGamma(b) - logGamma(a + b);
}

export function calculateSequentialBayesian(
  conversionsA: number,
  sampleA: number,
  conversionsB: number,
  sampleB: number,
  credibleLevel = 0.95,
): SequentialBayesianResult {
  const alphaA = conversionsA + 1;
  const betaA = sampleA - conversionsA + 1;
  const alphaB = conversionsB + 1;
  const betaB = sampleB - conversionsB + 1;
  const meanA = alphaA / (alphaA + betaA);
  const meanB = alphaB / (alphaB + betaB);
  const varianceA = alphaA * betaA / ((alphaA + betaA) ** 2 * (alphaA + betaA + 1));
  const varianceB = alphaB * betaB / ((alphaB + betaB) ** 2 * (alphaB + betaB + 1));
  const difference = meanB - meanA;
  const sigma = Math.sqrt(varianceA + varianceB);
  const z = sigma > 0 ? difference / sigma : 0;
  const posteriorProbabilityB = sigma > 0 ? normalCdf(z) : 0.5;
  const expectedLossB = sigma > 0 ? sigma * normalPdf(z) - difference * normalCdf(-z) : Math.max(0, -difference);
  const expectedLossA = sigma > 0 ? sigma * normalPdf(z) + difference * normalCdf(z) : Math.max(0, difference);
  const credibleZ = inverseNormalCdf(0.5 + credibleLevel / 2);

  const failuresA = sampleA - conversionsA;
  const failuresB = sampleB - conversionsB;
  const pooledSuccesses = conversionsA + conversionsB;
  const pooledFailures = failuresA + failuresB;
  const logAlternative = logBeta(conversionsA + 1, failuresA + 1) + logBeta(conversionsB + 1, failuresB + 1);
  const logNull = logBeta(pooledSuccesses + 1, pooledFailures + 1);
  const sequentialEvidence = Math.exp(Math.min(50, Math.max(-50, logAlternative - logNull)));
  return {
    sequentialEvidence,
    posteriorProbabilityB,
    expectedLossA,
    expectedLossB,
    credibleDifference: {
      low: Math.max(-1, difference - credibleZ * sigma),
      high: Math.min(1, difference + credibleZ * sigma),
    },
  };
}

export function sampleRatioMismatchPValue(sampleA: number, sampleB: number, trafficSplitPercent = 50) {
  const total = sampleA + sampleB;
  if (total <= 0) return null;
  const expectedB = total * trafficSplitPercent / 100;
  const expectedA = total - expectedB;
  if (expectedA <= 0 || expectedB <= 0) return null;
  const chiSquare = (sampleA - expectedA) ** 2 / expectedA + (sampleB - expectedB) ** 2 / expectedB;
  return clampProbability(2 * (1 - normalCdf(Math.sqrt(chiSquare))));
}

// Peter John Acklam's inverse-normal approximation.
export function inverseNormalCdf(probability: number) {
  if (probability <= 0 || probability >= 1) {
    throw new Error("Probability must be between 0 and 1.");
  }

  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924];
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857];
  const c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878];
  const d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742];
  const low = 0.02425;
  const high = 1 - low;

  if (probability < low) {
    const q = Math.sqrt(-2 * Math.log(probability));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }

  if (probability > high) {
    const q = Math.sqrt(-2 * Math.log(1 - probability));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }

  const q = probability - 0.5;
  const r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

export function wilsonInterval(successes: number, sampleSize: number, confidenceLevel = 0.9): ConfidenceInterval {
  if (sampleSize <= 0) return { low: 0, high: 0 };
  const p = successes / sampleSize;
  const z = inverseNormalCdf(0.5 + confidenceLevel / 2);
  const z2 = z * z;
  const denominator = 1 + z2 / sampleSize;
  const center = (p + z2 / (2 * sampleSize)) / denominator;
  const margin = z * Math.sqrt((p * (1 - p) + z2 / (4 * sampleSize)) / sampleSize) / denominator;
  return { low: clampProbability(center - margin), high: clampProbability(center + margin) };
}

export function twoProportionPValue(
  successesA: number,
  sampleA: number,
  successesB: number,
  sampleB: number,
  alternative: "two-sided" | "greater" = "two-sided",
) {
  if (sampleA <= 0 || sampleB <= 0) return null;
  const pooled = (successesA + successesB) / (sampleA + sampleB);
  const standardError = Math.sqrt(pooled * (1 - pooled) * (1 / sampleA + 1 / sampleB));
  if (standardError === 0) return successesA === successesB ? 1 : 0;
  const z = (successesB / sampleB - successesA / sampleA) / standardError;
  return alternative === "greater"
    ? clampProbability(1 - normalCdf(z))
    : clampProbability(2 * (1 - normalCdf(Math.abs(z))));
}

export function calculateBinaryExperiment(
  conversionsA: number,
  sampleA: number,
  conversionsB: number,
  sampleB: number,
  confidenceLevel = 0.9,
): BinaryExperimentResult {
  const rateA = sampleA > 0 ? conversionsA / sampleA : 0;
  const rateB = sampleB > 0 ? conversionsB / sampleB : 0;
  const absoluteDifference = rateB - rateA;
  const pValue = twoProportionPValue(conversionsA, sampleA, conversionsB, sampleB);
  const z = inverseNormalCdf(0.5 + confidenceLevel / 2);
  const differenceSe = sampleA > 0 && sampleB > 0
    ? Math.sqrt(rateA * (1 - rateA) / sampleA + rateB * (1 - rateB) / sampleB)
    : 0;

  return {
    rateA,
    rateB,
    absoluteDifference,
    liftPercent: rateA > 0 ? (absoluteDifference / rateA) * 100 : null,
    intervalA: wilsonInterval(conversionsA, sampleA, confidenceLevel),
    intervalB: wilsonInterval(conversionsB, sampleB, confidenceLevel),
    differenceInterval: {
      low: absoluteDifference - z * differenceSe,
      high: absoluteDifference + z * differenceSe,
    },
    pValue,
    confidence: pValue === null ? null : 1 - pValue,
  };
}

export function calculateRequiredSamplePerVariant(
  baselineRate: number,
  relativeMde = 0.1,
  confidenceLevel = 0.9,
  power = 0.8,
) {
  const p1 = Math.min(0.999, Math.max(0.001, baselineRate));
  const p2 = Math.min(0.999, Math.max(0.001, p1 * (1 + relativeMde)));
  const delta = Math.abs(p2 - p1);
  if (delta === 0) return 0;
  const pooled = (p1 + p2) / 2;
  const zAlpha = inverseNormalCdf(0.5 + confidenceLevel / 2);
  const zPower = inverseNormalCdf(power);
  const numerator = zAlpha * Math.sqrt(2 * pooled * (1 - pooled)) +
    zPower * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2));
  return Math.ceil((numerator * numerator) / (delta * delta));
}
