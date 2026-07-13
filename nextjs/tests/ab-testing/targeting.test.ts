import test from "node:test";
import assert from "node:assert/strict";
import { isDeviceEligible, normalizeDeviceContext } from "../../lib/server/ab-testing/targeting";

const targeting = {
  targetCountries: ["US", "VN"],
  targetLocales: ["en", "vi-vn"],
  targetPlatforms: ["ios"],
  targetOsVersions: { ios: { min: "17.0", max: "19.0" } },
};

test("normalizes SDK targeting context", () => {
  assert.deepEqual(normalizeDeviceContext({ countryCode: "vn", locale: "vi_VN", platform: "IOS", osVersion: "18.1" }), {
    countryCode: "VN",
    locale: "vi-vn",
    platform: "ios",
    osVersion: "18.1",
  });
});

test("all targeting dimensions must match", () => {
  assert.equal(isDeviceEligible(targeting, normalizeDeviceContext({ countryCode: "VN", locale: "vi-VN", platform: "ios", osVersion: "18.1" })), true);
  assert.equal(isDeviceEligible(targeting, normalizeDeviceContext({ countryCode: "VN", locale: "vi-VN", platform: "android", osVersion: "18.1" })), false);
  assert.equal(isDeviceEligible(targeting, normalizeDeviceContext({ countryCode: "VN", locale: "vi-VN", platform: "ios", osVersion: "16.4" })), false);
});

test("missing required context fails closed", () => {
  assert.equal(isDeviceEligible(targeting, normalizeDeviceContext({ countryCode: "VN", locale: "vi-VN" })), false);
});
