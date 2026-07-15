export type GeneratorOverrides = {
  sensitiveFieldPatterns: string[];
  typedJson: Record<string, string>;
  softDeleteModels: string[];
};

type ModelLike = {
  name: string;
  fields: readonly { name: string; type: unknown }[];
};

export function validateOverrides(models: readonly ModelLike[], overrides: GeneratorOverrides): void {
  const modelByName = new Map(models.map((model) => [model.name, model]));
  for (const modelName of overrides.softDeleteModels) {
    const model = modelByName.get(modelName);
    if (!model) throw new Error(`soft-delete override references unknown model ${modelName}`);
    if (!model.fields.some((field) => field.name === "deletedAt")) {
      throw new Error(`soft-delete model ${modelName} has no deletedAt field`);
    }
  }
  for (const key of Object.keys(overrides.typedJson)) {
    const [modelName, fieldName, ...rest] = key.split(".");
    const model = modelByName.get(modelName);
    const field = model?.fields.find((candidate) => candidate.name === fieldName);
    if (rest.length > 0 || !model || !field || field.type !== "Json") {
      throw new Error(`typed JSON override references unknown JSON field ${key}`);
    }
  }
}
