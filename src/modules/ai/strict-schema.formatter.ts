type JsonSchema = Record<string, unknown>;

/**
 * Сколько раз схеме разрешено сослаться на саму себя
 * (ограничение для рекурсии в conditions)
 */
const MAX_REFERENCE_DEPTH = 1;

/**
 * Готовит схему формы так, чтобы её принял OpenAI.
 * У OpenAI жесткие требования к JSON: нельзя присылать лишние поля, и все поля
 * обязательно должны быть заполнены (поэтому пустые поля мы превращаем в "значение ИЛИ null").
 * Также эта функция убирает бесконечные повторы (ссылки схемы на саму себя), иначе API выдаст ошибку.
 */
export function toStrictJsonSchema(schema: JsonSchema): JsonSchema {
  const { definitions, $defs, ...root } = schema;

  const strictSchema = toStrictSchema(
    root,
    (definitions ?? $defs ?? {}) as Record<string, JsonSchema>,
    0,
  );

  if (!strictSchema) {
    throw new Error("Схему невозможно развернуть");
  }

  return strictSchema;
}

/**
 * Приводит любой фрагмент схемы (строку, массив, объект)
 * к строгому виду. Управляет рекурсией и разворачивает ссылки.
 */
function toStrictSchema(
  original: JsonSchema,
  definitions: Record<string, JsonSchema>,
  depth: number,
): JsonSchema | null {
  const schema = unwrapAllOfWrapper(original);

  if ("$ref" in schema) {
    const referenced = definitions[definitionName(schema.$ref as string)];

    return depth < MAX_REFERENCE_DEPTH && referenced
      ? toStrictSchema(referenced, definitions, depth + 1)
      : null;
  }

  const { default: _default, oneOf, allOf, anyOf, ...rest } = schema;
  const strictSchema: JsonSchema = { ...rest };

  const variants = (oneOf ?? anyOf ?? allOf) as JsonSchema[] | undefined;

  if (variants) {
    const strictVariants = variants
      .map((variant) => toStrictSchema(variant, definitions, depth))
      .filter((variant): variant is JsonSchema => variant !== null);

    if (strictVariants.length === 0) return null;

    strictSchema.anyOf = strictVariants;
  }

  if (rest.items) {
    const strictItems = toStrictSchema(
      rest.items as JsonSchema,
      definitions,
      depth,
    );

    if (!strictItems) return null;

    strictSchema.items = strictItems;
  }

  if (rest.properties) {
    return toStrictObject(
      strictSchema,
      rest.properties as JsonSchema,
      definitions,
      depth,
    );
  }

  return strictSchema;
}

/**
 * Приводит отдельный объект к строгому виду:
 *
 * 1. Запрещает любые поля, отсутствующие в схеме (`additionalProperties: false`)
 * 2. Переводит необязательные поля в формат "значение или null"
 *    (так как OpenAI требует указывать все поля как обязательные)
 *
 * Если хотя бы одно обязательное поле не удалось обработать, функция возвращает null.
 */
function toStrictObject(
  objectSchema: JsonSchema,
  properties: JsonSchema,
  definitions: Record<string, JsonSchema>,
  depth: number,
): JsonSchema | null {
  const requiredNames = new Set(
    (objectSchema.required as string[] | undefined) ?? [],
  );
  const strictProperties: JsonSchema = {};

  for (const [name, property] of Object.entries(properties)) {
    const strictProperty = toStrictSchema(
      property as JsonSchema,
      definitions,
      depth,
    );

    if (!strictProperty) {
      if (requiredNames.has(name)) return null;
      continue;
    }

    strictProperties[name] = requiredNames.has(name)
      ? strictProperty
      : { anyOf: [strictProperty, nullSchema] };
  }

  return {
    ...objectSchema,
    additionalProperties: false,
    required: Object.keys(strictProperties),
    properties: strictProperties,
  };
}

const nullSchema: JsonSchema = { type: "null" };

/**
 * Извлекает чистую схему из искусственного массива `allOf`
 */
function unwrapAllOfWrapper(schema: JsonSchema): JsonSchema {
  const allOf = schema.allOf as JsonSchema[] | undefined;

  if (!allOf || allOf.length !== 1 || Object.keys(schema).length !== 1) {
    return schema;
  }

  return allOf[0] as JsonSchema;
}

/**
 * Извлекает чистое имя схемы из её технического пути.
 * Превращает системные ссылки вида "#/$defs/Имя" в простое "Имя".
 */
function definitionName(ref: string): string {
  return ref.replace(/^#\/(definitions|\$defs)\//, "");
}
