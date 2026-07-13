import assert from "node:assert/strict";
import test from "node:test";

import { currencyExponent, fromMinorUnits, toMinorUnits } from "../../lib/server/lepoship/money";

test("currency minor-unit conversion handles zero, two and three decimal currencies", () => {
  assert.equal(currencyExponent("VND"), 0);
  assert.equal(currencyExponent("USD"), 2);
  assert.equal(currencyExponent("KWD"), 3);
  assert.equal(toMinorUnits(12.34, "USD"), BigInt(1_234));
  assert.equal(toMinorUnits(12, "VND"), BigInt(12));
  assert.equal(fromMinorUnits(BigInt(1_234), "USD"), 12.34);
});

test("money conversion rejects invalid values", () => {
  assert.throws(() => toMinorUnits(Number.NaN, "USD"), /INVALID_MONEY_AMOUNT/);
  assert.throws(() => toMinorUnits(-1, "USD"), /INVALID_MONEY_AMOUNT/);
});
