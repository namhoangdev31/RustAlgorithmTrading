import { generatorHandler, GeneratorOptions } from "@prisma/generator-helper";
import { promises as fs } from "node:fs";
import path from "node:path";
import { validateOverrides, type GeneratorOverrides } from "./validation";

type DMMFField = GeneratorOptions["dmmf"]["datamodel"]["models"][number]["fields"][number];
type DMMFModel = GeneratorOptions["dmmf"]["datamodel"]["models"][number];

type Overrides = GeneratorOverrides;

type ParsedIndex = { fields: string[]; descending: string[]; name?: string; unique: boolean };

const generatorDir = path.dirname(new URL(import.meta.url).pathname);

function goName(value: string): string {
  const initialisms = new Set(["id", "api", "url", "http", "https", "ip", "sdk", "ssl", "waf", "ota"]);
  return value
    .replace(/[^A-Za-z0-9]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim()
    .split(/\s+/)
    .map((part) => initialisms.has(part.toLowerCase()) ? part.toUpperCase() : part[0].toUpperCase() + part.slice(1))
    .join("");
}

function quote(value: string): string {
  return JSON.stringify(value);
}

function nativeType(field: DMMFField): [string, string[]] | undefined {
  return (field as DMMFField & { nativeType?: [string, string[]] }).nativeType;
}

function schemaType(field: DMMFField): string | undefined {
  const native = nativeType(field);
  if (!native) return undefined;
  const [name, args] = native;
  switch (name) {
    case "Uuid": return "uuid";
    case "VarChar": return `varchar(${args.join(",")})`;
    case "Char": return `char(${args.join(",")})`;
    case "Text": return "text";
    case "Json":
    case "JsonB": return "jsonb";
    case "Decimal": return `numeric(${args.join(",")})`;
    case "Timestamp": return `timestamp(${args[0] ?? "6"})`;
    case "Timestamptz": return `timestamptz(${args[0] ?? "6"})`;
    case "Date": return "date";
    case "Time": return `time(${args[0] ?? "6"})`;
    case "ByteA": return "bytea";
    case "Inet": return "inet";
    default: return undefined;
  }
}

function renderDefault(field: DMMFField): string[] {
  const result: string[] = [];
  const value = field.default as unknown;
  const named = value && typeof value === "object" && "name" in value
    ? String((value as { name: string }).name)
    : undefined;

  if (named === "now") result.push("Default(time.Now)");
  if (named === "uuid") result.push("Default(uuid.New)");
  if (named === "cuid") result.push("DefaultFunc(cuid.New)");
  if ((field as DMMFField & { isUpdatedAt?: boolean }).isUpdatedAt) result.push("UpdateDefault(time.Now)");
  if (value !== undefined && value !== null && !named) {
    if (field.isList && Array.isArray(value)) {
      result.push("Default(func() pq.StringArray { return pq.StringArray{} })");
    } else if (field.type === "Json" && typeof value === "string") {
      result.push(`Default(func() json.RawMessage { return json.RawMessage(${quote(value)}) })`);
    } else if (typeof value === "string" && ["Int", "BigInt", "Float"].includes(String(field.type)) && /^-?\d+(\.\d+)?$/.test(value)) {
      result.push(`Default(${value})`);
    } else if (typeof value === "string") {
      result.push(`Default(${quote(value)})`);
    } else if (["number", "boolean"].includes(typeof value)) {
      result.push(`Default(${String(value)})`);
    }
  }
  return result;
}

function fieldExpression(field: DMMFField, overrides: Overrides, relationScalar: boolean): { expression: string; imports: string[] } {
  const imports = new Set<string>();
  const dbType = schemaType(field);
  let expression: string;

  if (field.isList) {
    if (field.type !== "String") throw new Error(`unsupported scalar list ${field.name}: ${field.type}[]`);
    imports.add("github.com/lib/pq");
    expression = `field.Other(${quote(field.name)}, pq.StringArray{}).SchemaType(map[string]string{dialect.Postgres: "text[]"})`;
    imports.add("entgo.io/ent/dialect");
  } else if (field.kind === "enum") {
    const enumType = goName(String(field.type));
    expression = `field.Enum(${quote(field.name)}).GoType(${enumType}(""))`;
  } else if (field.type === "String" && dbType === "uuid") {
    imports.add("github.com/google/uuid");
    expression = `field.UUID(${quote(field.name)}, uuid.UUID{})`;
  } else {
    switch (field.type) {
      case "String": expression = `field.String(${quote(field.name)})`; break;
      case "Int": expression = `field.Int(${quote(field.name)})`; break;
      case "BigInt": expression = `field.Int64(${quote(field.name)})`; break;
      case "Float": expression = `field.Float(${quote(field.name)})`; break;
      case "Decimal":
        imports.add("github.com/shopspring/decimal");
        expression = `field.Other(${quote(field.name)}, decimal.Decimal{})`;
        break;
      case "Boolean": expression = `field.Bool(${quote(field.name)})`; break;
      case "DateTime":
        expression = `field.Time(${quote(field.name)})`;
        break;
      case "Json":
        imports.add("encoding/json");
        expression = `field.JSON(${quote(field.name)}, json.RawMessage{})`;
        break;
      case "Bytes": expression = `field.Bytes(${quote(field.name)})`; break;
      default: throw new Error(`unsupported field ${field.name}: ${field.type}`);
    }
    if (dbType && !["uuid"].includes(dbType)) {
      imports.add("entgo.io/ent/dialect");
      expression += `.SchemaType(map[string]string{dialect.Postgres: ${quote(dbType)}})`;
    }
  }

  const storageKey = (field as DMMFField & { dbName?: string | null }).dbName;
  if (storageKey && storageKey !== field.name) expression += `.StorageKey(${quote(storageKey)})`;
  if (!field.isRequired) {
    expression += ".Optional()";
    if (field.type !== "Json") expression += ".Nillable()";
  }
  if (!relationScalar && (field as DMMFField & { isUnique?: boolean }).isUnique) expression += ".Unique()";

  const defaults = renderDefault(field);
  for (const item of defaults) {
    if (item.includes("time.")) imports.add("time");
    if (item.includes("uuid.")) imports.add("github.com/google/uuid");
    if (item.includes("cuid.")) imports.add("github.com/lucsky/cuid");
    if (item.includes("pq.")) imports.add("github.com/lib/pq");
    if (item.includes("json.")) imports.add("encoding/json");
    expression += `.${item}`;
  }

  if (["String", "Bytes", "Json", "Decimal"].includes(String(field.type)) && overrides.sensitiveFieldPatterns.some((pattern) => field.name.toLowerCase().includes(pattern.toLowerCase()))) {
    expression += ".Sensitive()";
  }
  return { expression, imports: [...imports] };
}

function generatedEdgeName(model: DMMFModel, field: DMMFField): string {
  const collision = model.fields.some((candidate) => candidate.kind !== "object" && goName(candidate.name) === `Has${goName(field.name)}`);
  return collision ? `${field.name}Relation` : field.name;
}

function renderEdge(field: DMMFField, model: DMMFModel, models: readonly DMMFModel[]): string {
  const relationFields = field.relationFromFields ?? [];
  const target = goName(String(field.type));
  let expression: string;
  if (relationFields.length > 0) {
    const inverse = models.find((candidate) => candidate.name === field.type)?.fields.find((candidate) => candidate.kind === "object" && candidate.type === model.name && candidate.relationName === field.relationName && (candidate.relationFromFields?.length ?? 0) === 0);
    if (!inverse) throw new Error(`cannot resolve inverse edge ${model.name}.${field.name} (${field.relationName ?? "unnamed"})`);
    const targetModel = models.find((candidate) => candidate.name === field.type)!;
    expression = `edge.From(${quote(generatedEdgeName(model, field))}, ${target}.Type).Ref(${quote(generatedEdgeName(targetModel, inverse))}).Field(${quote(relationFields[0])}).Unique()`;
    if (field.isRequired) expression += ".Required()";
  } else {
    expression = `edge.To(${quote(generatedEdgeName(model, field))}, ${target}.Type)`;
    if (!field.isList) expression += ".Unique()";
  }
  return expression;
}

function parseIndexes(datamodel: string): Map<string, ParsedIndex[]> {
  const result = new Map<string, ParsedIndex[]>();
  const modelPattern = /model\s+(\w+)\s*\{([\s\S]*?)\n\}/g;
  for (const match of datamodel.matchAll(modelPattern)) {
    const indexes: ParsedIndex[] = [];
    for (const line of match[2].split("\n")) {
      const index = line.match(/@@(index|unique)\(\[([^\]]+)\](?:,\s*map:\s*"([^"]+)")?/);
      if (!index) continue;
      const entries = index[2].split(",").map((entry) => entry.trim());
      indexes.push({
        fields: entries.map((entry) => entry.replace(/\(.*/, "")),
        descending: entries.filter((entry) => /sort:\s*Desc/.test(entry)).map((entry) => entry.replace(/\(.*/, "")),
        name: index[3],
        unique: index[1] === "unique",
      });
    }
    result.set(match[1], indexes);
  }
  return result;
}

function renderIndexes(model: DMMFModel, parsed: ParsedIndex[]): string[] {
  const metadata = model as DMMFModel & {
    uniqueIndexes?: Array<{ name?: string | null; fields: string[] }>;
    indexes?: Array<{ name?: string | null; fields: Array<string | { name: string }> }>;
  };
  const indexes: string[] = [];
  const seen = new Set<string>();
  for (const item of metadata.uniqueIndexes ?? []) {
    let expression = `index.Fields(${item.fields.map(quote).join(", ")}).Unique()`;
    if (item.name) expression += `.StorageKey(${quote(item.name)})`;
    indexes.push(expression);
    seen.add(`true:${item.fields.join(",")}`);
  }
  for (const item of metadata.indexes ?? []) {
    const fields = item.fields.map((entry) => typeof entry === "string" ? entry : entry.name);
    let expression = `index.Fields(${fields.map(quote).join(", ")})`;
    if (item.name) expression += `.StorageKey(${quote(item.name)})`;
    indexes.push(expression);
    seen.add(`false:${fields.join(",")}`);
  }
  for (const item of parsed) {
      if (seen.has(`${item.unique}:${item.fields.join(",")}`)) continue;
      let expression = `index.Fields(${item.fields.map(quote).join(", ")})`;
      if (item.unique) expression += ".Unique()";
      if (item.name) expression += `.StorageKey(${quote(item.name)})`;
      if (item.descending.length === 1 && item.fields.length === 1) expression += ".Annotations(entsql.Desc())";
      if (item.descending.length > 0 && item.fields.length > 1) expression += `.Annotations(entsql.DescColumns(${item.descending.map(quote).join(", ")}))`;
      indexes.push(expression);
  }
  return indexes;
}

function renderEnum(name: string, values: string[]): string {
  const typeName = goName(name);
  return [
    `type ${typeName} string`,
    "",
    "const (",
    ...values.map((value) => `\t${typeName}${goName(value)} ${typeName} = ${quote(value)}`),
    ")",
    "",
    `func (${typeName}) Values() []string {`,
    `\treturn []string{${values.map(quote).join(", ")}}`,
    "}",
    "",
  ].join("\n");
}

async function renderModel(model: DMMFModel, models: readonly DMMFModel[], overrides: Overrides, output: string, parsedIndexes: Map<string, ParsedIndex[]>): Promise<void> {
  const imports = new Set<string>([
    "entgo.io/ent",
    "entgo.io/ent/schema",
    "entgo.io/ent/schema/field",
    "entgo.io/ent/dialect/entsql",
  ]);
  const relationScalars = new Set(model.fields.flatMap((field) => field.relationFromFields ?? []));
  const softDelete = overrides.softDeleteModels.includes(model.name);
  const fields = model.fields.filter((field) => field.kind !== "object" && !(softDelete && field.name === "deletedAt")).map((item) => {
    const rendered = fieldExpression(item, overrides, relationScalars.has(item.name));
    rendered.imports.forEach((entry) => imports.add(entry));
    return rendered.expression;
  });
  const edges = model.fields.filter((field) => field.kind === "object").map((field) => renderEdge(field, model, models));
  const indexes = renderIndexes(model, parsedIndexes.get(model.name) ?? []);
  if (edges.length > 0) imports.add("entgo.io/ent/schema/edge");
  if (indexes.length > 0) imports.add("entgo.io/ent/schema/index");
  const table = (model as DMMFModel & { dbName?: string | null }).dbName ?? model.name;
  const typeName = goName(model.name);
  const mixin = softDelete ? `\nfunc (${typeName}) Mixin() []ent.Mixin {\n\treturn []ent.Mixin{SoftDeleteMixin{}}\n}\n` : "";
  const source = `// Code generated by prisma-ent-generator. DO NOT EDIT.\n\npackage schema\n\nimport (\n${[...imports].sort().map((item) => `\t${quote(item)}`).join("\n")}\n)\n\ntype ${typeName} struct { ent.Schema }\n${mixin}\nfunc (${typeName}) Annotations() []schema.Annotation {\n\treturn []schema.Annotation{entsql.Annotation{Table: ${quote(table)}}}\n}\n\nfunc (${typeName}) Fields() []ent.Field {\n\treturn []ent.Field{\n${fields.map((item) => `\t\t${item},`).join("\n")}\n\t}\n}\n\nfunc (${typeName}) Edges() []ent.Edge {\n\treturn []ent.Edge{\n${edges.map((item) => `\t\t${item},`).join("\n")}\n\t}\n}\n\nfunc (${typeName}) Indexes() []ent.Index {\n\treturn []ent.Index{\n${indexes.map((item) => `\t\t${item},`).join("\n")}\n\t}\n}\n`;
  await fs.writeFile(path.join(output, `${model.name.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase()}.go`), source);
}

generatorHandler({
  onManifest() {
    return {
      defaultOutput: "../../go/internal/data/ent/schema",
      prettyName: "Prisma to Ent schema generator",
    };
  },
  async onGenerate(options) {
    if (!options.generator.output?.value) throw new Error("Ent generator output is required");
    const output = options.generator.output.value;
    const overrides = JSON.parse(await fs.readFile(path.join(generatorDir, "overrides.json"), "utf8")) as Overrides;
    await fs.rm(output, { recursive: true, force: true });
    await fs.mkdir(output, { recursive: true });
    const models = options.dmmf.datamodel.models;
    validateOverrides(models, overrides);
    const parsedIndexes = parseIndexes(options.datamodel);
    for (const model of models) await renderModel(model, models, overrides, output, parsedIndexes);
    const softDeleteMixin = `// Code generated by prisma-ent-generator. DO NOT EDIT.\n\npackage schema\n\nimport (\n\t"entgo.io/ent"\n\t"entgo.io/ent/schema/field"\n\t"entgo.io/ent/schema/mixin"\n\t"entgo.io/ent/dialect"\n)\n\ntype SoftDeleteMixin struct { mixin.Schema }\n\nfunc (SoftDeleteMixin) Fields() []ent.Field {\n\treturn []ent.Field{\n\t\tfield.Time("deletedAt").SchemaType(map[string]string{dialect.Postgres: "timestamp(6)"}).StorageKey("deleted_at").Optional().Nillable(),\n\t}\n}\n`;
    await fs.writeFile(path.join(output, "soft_delete_mixin.go"), softDeleteMixin);
    const softDeleteCases = overrides.softDeleteModels.map((name) => `\tcase *${goName(name)}Query:\n\t\tq.Where(sql.FieldIsNull("deleted_at"))`).join("\n");
    const softDeleteTypes = overrides.softDeleteModels.map((name) => `${quote(name)}: {}`).join(", ");
    const softDeleteRuntime = `// Code generated by prisma-ent-generator. DO NOT EDIT.\n\npackage ent\n\nimport (\n\t"context"\n\t"errors"\n\t"time"\n\n\tbaseent "entgo.io/ent"\n\t"entgo.io/ent/dialect/sql"\n)\n\ntype softDeleteContextKey uint8\n\nconst (\n\twithDeletedKey softDeleteContextKey = iota\n\twithHardDeleteKey\n)\n\nfunc WithDeleted(ctx context.Context) context.Context { return context.WithValue(ctx, withDeletedKey, true) }\nfunc WithHardDelete(ctx context.Context) context.Context { return context.WithValue(ctx, withHardDeleteKey, true) }\n\nfunc SoftDeleteInterceptor() baseent.Interceptor {\n\treturn baseent.TraverseFunc(func(ctx context.Context, query baseent.Query) error {\n\t\tif enabled, _ := ctx.Value(withDeletedKey).(bool); enabled { return nil }\n\t\tswitch q := query.(type) {\n${softDeleteCases}\n\t\t}\n\t\treturn nil\n\t})\n}\n\nfunc SoftDeleteHook() baseent.Hook {\n\tsoftDeleteTypes := map[string]struct{}{${softDeleteTypes}}\n\treturn func(next baseent.Mutator) baseent.Mutator {\n\t\treturn baseent.MutateFunc(func(ctx context.Context, mutation baseent.Mutation) (baseent.Value, error) {\n\t\t\tif !mutation.Op().Is(baseent.OpDeleteOne|baseent.OpDelete) { return next.Mutate(ctx, mutation) }\n\t\t\tif hard, _ := ctx.Value(withHardDeleteKey).(bool); hard { return next.Mutate(ctx, mutation) }\n\t\t\tif _, ok := softDeleteTypes[mutation.Type()]; !ok { return next.Mutate(ctx, mutation) }\n\t\t\tsetter, ok := mutation.(interface{ SetOp(baseent.Op) })\n\t\t\tif !ok { return nil, errors.New("soft-delete mutation does not support SetOp") }\n\t\t\tif mutation.Op().Is(baseent.OpDeleteOne) { setter.SetOp(baseent.OpUpdateOne) } else { setter.SetOp(baseent.OpUpdate) }\n\t\t\tif err := mutation.SetField("deletedAt", time.Now().UTC()); err != nil { return nil, err }\n\t\t\treturn next.Mutate(ctx, mutation)\n\t\t})\n\t}\n}\n`;
    await fs.writeFile(path.join(output, "..", "soft_delete.go"), softDeleteRuntime);
    const enumSource = `// Code generated by prisma-ent-generator. DO NOT EDIT.\n\npackage schema\n\n${options.dmmf.datamodel.enums.map((item) => renderEnum(item.name, item.values.map((value) => value.name))).join("\n")}`;
    await fs.writeFile(path.join(output, "enums.go"), enumSource);
  },
});
