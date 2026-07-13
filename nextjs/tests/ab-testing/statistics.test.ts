import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateBinaryExperiment,
  calculateRequiredSamplePerVariant,
  calculateSequentialBayesian,
  sampleRatioMismatchPValue,
  twoProportionPValue,
  wilsonInterval,
} from "../../lib/ab-testing/statistics";

test("equal conversion rates are inconclusive", () => {
  const result = calculateBinaryExperiment(50, 100, 50, 100);
  assert.equal(result.absoluteDifference, 0);
  assert.ok(result.pValue !== null && result.pValue > 0.9);
});

test("Bayesian evidence favors a materially better treatment", () => {
  const result = calculateSequentialBayesian(1_000, 10_000, 1_300, 10_000);
  assert.ok(result.posteriorProbabilityB > 0.99);
  assert.ok(result.expectedLossB < 0.001);
  assert.ok(result.sequentialEvidence > 20);
});

test("sample ratio mismatch detects assignment corruption", () => {
  const healthy = sampleRatioMismatchPValue(5_000, 5_000, 50);
  const unhealthy = sampleRatioMismatchPValue(6_000, 4_000, 50);
  assert.ok(healthy !== null && healthy > 0.9);
  assert.ok(unhealthy !== null && unhealthy < 0.001);
});

test("detects a materially better treatment", () => {
  const result = calculateBinaryExperiment(100, 1_000, 140, 1_000);
  assert.ok(result.absoluteDifference > 0);
  assert.ok(result.pValue !== null && result.pValue < 0.1);
  assert.equal(Math.round(result.liftPercent || 0), 40);
});

test("zero control rate returns no relative lift", () => {
  const result = calculateBinaryExperiment(0, 100, 5, 100);
  assert.equal(result.liftPercent, null);
  assert.equal(result.absoluteDifference, 0.05);
});

test("Wilson intervals remain bounded", () => {
  assert.deepEqual(wilsonInterval(0, 0), { low: 0, high: 0 });
  const interval = wilsonInterval(5, 10);
  assert.ok(interval.low >= 0 && interval.high <= 1 && interval.low < interval.high);
});

test("sample-size calculation is deterministic and conservative", () => {
  const sample = calculateRequiredSamplePerVariant(0.5, 0.1, 0.9, 0.8);
  assert.ok(sample > 1_000);
  assert.equal(sample, calculateRequiredSamplePerVariant(0.5, 0.1, 0.9, 0.8));
});

test("one-sided crash test only favors a higher treatment rate", () => {
  const higher = twoProportionPValue(2, 100, 10, 100, "greater");
  const lower = twoProportionPValue(10, 100, 2, 100, "greater");
  assert.ok(higher !== null && higher < 0.05);
  assert.ok(lower !== null && lower > 0.95);
});
