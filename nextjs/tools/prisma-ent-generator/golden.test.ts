import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import test from "node:test";

import { validateOverrides } from "./validation";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const schemaPath = path.join(root, "prisma/schema.prisma");
const entSchemaPath = path.resolve(root, "../go/internal/data/ent/schema");

test("generated Ent schemas preserve representative Prisma mappings", async () => {
  const prisma = await fs.readFile(schemaPath, "utf8");
  const modelCount = [...prisma.matchAll(/^model\s+\w+\s*\{/gm)].length;
  assert.equal(modelCount, 140);

  const files = (await fs.readdir(entSchemaPath)).filter((file) => file.endsWith(".go"));
  assert.equal(files.length, modelCount + 2);

  const cases: Array<[string, RegExp[]]> = [
    ["bundle_ledger_entries.go", [/decimal\.Decimal/, /numeric\(20,0\)/, /StorageKey\("transaction_id"\)/]],
    ["bundle_artifacts.go", [/field\.UUID\("id"/, /entsql\.Annotation\{Table: "bundle_artifacts"\}/]],
    ["bundle_reviews.go", [/index\.Fields\("bundleId", "userId"\)\.Unique\(\)/]],
    ["native_cloud_target.go", [/json\.RawMessage/]],
    ["bundle_entitlement_licenses.go", [/pq\.StringArray/, /text\[\]/]],
    ["session.go", [/SoftDeleteMixin/]],
    ["enums.go", [/type BundleReleaseStatus string/, /BundleReleaseStatusActive/]],
  ];
  for (const [file, patterns] of cases) {
    const source = await fs.readFile(path.join(entSchemaPath, file), "utf8");
    for (const pattern of patterns) assert.match(source, pattern, `${file} must match ${pattern}`);
  }
});

test("override validation rejects stale metadata", () => {
  const models = [{ name: "User", fields: [{ name: "deletedAt", type: "DateTime" }, { name: "profile", type: "Json" }] }];
  assert.doesNotThrow(() => validateOverrides(models, { sensitiveFieldPatterns: [], softDeleteModels: ["User"], typedJson: { "User.profile": "Profile" } }));
  assert.throws(() => validateOverrides(models, { sensitiveFieldPatterns: [], softDeleteModels: ["Missing"], typedJson: {} }), /unknown model/);
  assert.throws(() => validateOverrides(models, { sensitiveFieldPatterns: [], softDeleteModels: [], typedJson: { "User.missing": "Profile" } }), /unknown JSON field/);
});
