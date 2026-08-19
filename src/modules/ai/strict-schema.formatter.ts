type JsonSchema = Record<string, unknown>;

/**
 * Ограничение для рекурсии. Одного уровня хватает
 * на условие вида "and: [правило, правило]"
 */
const MAX_REF_DEPTH = 1;

/**
 * Переделывает zod схему так, чтобы её принял OpenAI.
 * У OpenAI жесткие требования к JSON: нельзя присылать лишние поля, и все поля
 * обязательно должны быть заполнены (поэтому пустые поля мы превращаем в "значение ИЛИ null").
 * Также эта функция убирает бесконечные повторы (ссылки схемы на саму себя), иначе API выдаст ошибку.
 */
export function toStrictJsonSchema(schema: JsonSchema): JsonSchema {
  const { definitions, $defs, ...rest } = schema;
  const defs = (definitions ?? $defs ?? {}) as Record<string, JsonSchema>;

  const converted = convert(rest, defs, 0);

  if (!converted) {
    throw new Error("Схему невозможно развернуть: она рекурсивна целиком");
  }

  return converted;
}

function convert(
  node: JsonSchema,
  defs: Record<string, JsonSchema>,
  depth: number,
): JsonSchema | null {
  const unwrapped = unwrapSingleAllOf(node);

  if ("$ref" in unwrapped) {
    const target = defs[refName(unwrapped.$ref as string)];

    return depth < MAX_REF_DEPTH && target
      ? convert(target, defs, depth + 1)
      : null;
  }

  const { default: _default, oneOf, allOf, anyOf, ...rest } = unwrapped;
  const result: JsonSchema = { ...rest };

  const branches = (oneOf ?? anyOf ?? allOf) as JsonSchema[] | undefined;

  if (branches) {
    const kept = branches
      .map((branch) => convert(branch, defs, depth))
      .filter((branch): branch is JsonSchema => branch !== null);

    if (kept.length === 0) return null;

    result.anyOf = kept;
  }

  if (rest.items) {
    const items = convert(rest.items as JsonSchema, defs, depth);

    if (!items) return null;

    result.items = items;
  }

  if (rest.properties) {
    return convertObject(result, rest.properties as JsonSchema, defs, depth);
  }

  return result;
}

/**
 * Делает объект строго валидируемым:
 * 1. Запрещает любые неизвестные поля.
 * 2. Заставляет перечислять все поля в блоке required.
 * 3. Те поля, которые были необязательными, переводит в формат "значение или null".
 */
function convertObject(
  node: JsonSchema,
  properties: JsonSchema,
  defs: Record<string, JsonSchema>,
  depth: number,
): JsonSchema | null {
  const required = new Set((node.required as string[] | undefined) ?? []);
  const converted: JsonSchema = {};

  for (const [name, property] of Object.entries(properties)) {
    const value = convert(property as JsonSchema, defs, depth);

    if (!value) {
      if (required.has(name)) return null;
      continue;
    }

    converted[name] = required.has(name) ? value : { anyOf: [value, nullType] };
  }

  return {
    ...node,
    additionalProperties: false,
    required: Object.keys(converted),
    properties: converted,
  };
}

const nullType: JsonSchema = { type: "null" };

function unwrapSingleAllOf(node: JsonSchema): JsonSchema {
  const allOf = node.allOf as JsonSchema[] | undefined;

  if (!allOf || allOf.length !== 1 || Object.keys(node).length !== 1) {
    return node;
  }

  return allOf[0] as JsonSchema;
}

function refName(ref: string): string {
  return ref.replace(/^#\/(definitions|\$defs)\//, "");
}
