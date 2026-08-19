type JsonSchema = Record<string, unknown>;

/**
 * Переделывает zod схему под требования OpenAI Structured Outputs.
 * Без этого API выдаст ошибку 400, так как требует отключать лишние поля
 * (additionalProperties: false) и явно перечислять все свойства в required.
 */
export function toStrictJsonSchema(schema: JsonSchema): JsonSchema {
  const { definitions, $defs, ...rest } = schema;
  const sharedDefs = (definitions ?? $defs) as JsonSchema | undefined;

  const converted = convert(rest);

  if (!sharedDefs) return converted;

  return {
    ...converted,
    $defs: Object.fromEntries(
      Object.entries(sharedDefs).map(([name, definition]) => [
        name,
        convert(definition as JsonSchema),
      ]),
    ),
  };
}

function convert(node: JsonSchema): JsonSchema {
  const unwrapped = unwrapSingleAllOf(node);

  if ("$ref" in unwrapped) {
    return { $ref: rewriteRef(unwrapped.$ref as string) };
  }

  const { default: _default, oneOf, allOf, anyOf, ...rest } = unwrapped;

  const result: JsonSchema = { ...rest };

  const branches = (oneOf ?? anyOf ?? allOf) as JsonSchema[] | undefined;

  if (branches) {
    result.anyOf = branches.map(convert);
  }

  if (rest.items) {
    result.items = convert(rest.items as JsonSchema);
  }

  if (rest.properties) {
    return convertObject(result, rest.properties as JsonSchema);
  }

  return result;
}

/**
 * Делает объект строго валидируемым:
 * 1. Запрещает любые неизвестные поля.
 * 2. Заставляет перечислять все поля в блоке required.
 * 3. Те поля, которые были необязательными, переводит в формат "значение или null".
 */
function convertObject(node: JsonSchema, properties: JsonSchema): JsonSchema {
  const names = Object.keys(properties);
  const required = new Set((node.required as string[] | undefined) ?? []);

  return {
    ...node,
    additionalProperties: false,
    required: names,
    properties: Object.fromEntries(
      names.map((name) => {
        const converted = convert(properties[name] as JsonSchema);
        return [
          name,
          required.has(name) ? converted : { anyOf: [converted, nullType] },
        ];
      }),
    ),
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

function rewriteRef(ref: string): string {
  return ref.replace("#/definitions/", "#/$defs/");
}
