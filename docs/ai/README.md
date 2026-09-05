# Модуль ИИ: полный путь запроса

Запрос `POST /api/forms/:formId/ai/generate` от HTTP-тела
до ответа клиенту: какие функции его трогают, что именно каждая из них меняет
и почему.

---

## Содержание

1. [Карта модуля](#1-карта-модуля)
2. [Шаг 0. Маршрут, валидация тела, авторизация](#2-шаг-0-маршрут-валидация-тела-авторизация)
3. [Шаг 1. Квота](#3-шаг-1-квота)
4. [Шаг 2. Сборка промптов](#4-шаг-2-сборка-промптов)
5. [Шаг 3. Схема ответа: zod → JSON Schema → strict](#5-шаг-3-схема-ответа-zod--json-schema--strict)
6. [Шаг 4. Тело HTTP-запроса в OpenAI](#6-шаг-4-тело-http-запроса-в-openai)
7. [Шаг 5. Что возвращает OpenAI](#7-шаг-5-что-возвращает-openai)
8. [Шаг 6. Разбор ответа](#8-шаг-6-разбор-ответа)
9. [Шаг 7. Ответ клиенту](#9-шаг-7-ответ-клиенту)
10. [Приложение. Полная строгая схема](#10-приложение-полная-схема-для-openai)

---

## 1. Карта модуля

В работе участвуют два модуля, и они делят обязанности так:

| Что               | Где               | Отвечает за                                         |
| ----------------- | ----------------- | --------------------------------------------------- |
| `modules/ai`      | транспорт         | HTTP к OpenAI, строгая схема, ретраи, разбор ответа |
| `modules/form/ai` | прикладная логика | какие промпты, какая схема ответа, какая задача     |

`modules/ai` ничего не знает про формы: `ask()` принимает произвольную zod-схему.
`modules/form/ai` ничего не знает про HTTP к OpenAI: он собирает `StructuredRequest`
и отдаёт его наружу.

````
POST /api/forms/:formId/ai/generate
  │
  ├─ authMiddleware                      shared/http/middleware/auth.middleware.ts
  ├─ validate(aiConstructorDto)          shared/http/middleware/validate.middleware.ts
  │
  └─ AiConstructorController.generate    modules/form/api/ai-constructor.controller.ts
       ├─ findFormOrFail + formPolicy.update      → 404 / 403
       ├─ quota.spendOrFail(userId)               → 429   modules/ai/ai.quota.ts
       └─ AiConstructorService.generateResponse   modules/form/ai/ai-constructor.service.ts
            ├─ renderPrompt("ai-constructor.system.md", { fieldTypes })   modules/ai/prompt.ts
            ├─ renderPrompt("ai-constructor.user.md", { form, prompt })
            └─ AiService.ask({ name, schema, messages })   modules/ai/ai.service.ts
                 ├─ buildRequestBody
                 │    └─ toJsonSchema
                 │         ├─ z.toJSONSchema(schema, { io: "input", target: "draft-7" })
                 │         ├─ снять $schema
                 │         └─ toStrictJsonSchema        modules/ai/strict-schema.formatter.ts
                 ├─ checkAnswerIsReady → send → sendHttpRequest → fetch
                 ├─ extractContent  (completionSchema)
                 ├─ parseJson       (снять ```json-обёртку)
                 ├─ dropNulls       (убрать null-заглушки)
                 └─ schema.safeParse (тот же zod, что ушёл в OpenAI)
````

---

## 2. Шаг 0. Маршрут, валидация тела, авторизация

Роутер (`modules/form/api/ai-constructor.routes.ts`):

```ts
router.post(
  "/generate",
  authMiddleware,
  validate(aiConstructorDto.generateSchema),
  controller.generate,
);
```

Тело запроса от клиента:

```http
POST /api/forms/9f1c.../ai/generate
Authorization: Bearer <access token>
Content-Type: application/json

{ "prompt": "добавь поле для комментария, которое появляется если выбрали "Нет"" }
```

`validate` прогоняет его через DTO (`ai-constructor.dto.ts`):

```ts
export const aiConstructorDto = {
  generateSchema: z.object({
    prompt: z.string().trim().min(1).max(5000),
  }),
};
```

Дальше контроллер (`ai-constructor.controller.ts`) достаёт форму и проверяет права:

```ts
const { prompt } = req.body as GenerateFormDto;
const userId = requireUser(req);
const form = await findOwnedOrFail(req, userId);
```

ИИ правит **только существующую** форму.

---

## 3. Шаг 1. Квота

```ts
await quota.spendOrFail(userId);
```

`modules/ai/ai.quota.ts` считает запросы в Redis по ключу вида
`ai:quota:<userId>:2026-08-28` (дата в локальной таймзоне, формат `YYYY-MM-DD`).

```ts
const used = await redis.incr(key);
if (used === 1) await redis.expireat(key, <ближайшая полночь>);
if (used > limit) {
  await redis.decr(key);
  throw new TooManyRequestsError(...);
}
```

Порядок: `увеличение счетчика квоты → проверка → откат счетчика`.
Читающий эндпоинт `GET /api/ai/limit` (`ai.controller.ts`) отдаёт то же состояние
без списания.

Списание происходит **до** обращения к OpenAI и не возвращается, если OpenAI
ответил ошибкой.

---

## 4. Шаг 2. Сборка промптов

`AiConstructorService.generateResponse` собирает два сообщения из `.md`-шаблонов
в `prompts/`. Подстановку делает `renderPrompt` (`modules/ai/prompt.ts`) -
она читает файл, обрезает пробелы по краям и заменяет `{{ключ}}` на значение:

```ts
template
  .trim()
  .replace(/\{\{(\w+)}}/g, (placeholder, key) => values[key] ?? placeholder);
```

### 4.1. Системное сообщение

Единственный плейсхолдер - `{{fieldTypes}}`. Список берётся не из текста промпта,
а **из самой zod-схемы**, чтобы он не разъезжался с кодом:

```ts
const availableFieldTypes = formElementTypes
  .map((type) => `- ${type}`)
  .join("\n");
```

Результат подстановки:

```
### Поддерживаемые типы полей
- text
- email
- textarea
- number
- dropdown
- radiogroup
- checkbox
```

Полный отрендеренный системный промпт (пример):

```markdown
Ты - конструктор форм.

Твоя задача - изменить существующую форму согласно пожеланию пользователя.

### Поддерживаемые типы полей

- text
- email
- textarea
- number
- dropdown
- radiogroup
- checkbox

Никогда не придумывай новые типы полей.

### Правила для полей

- У каждого поля обязательны "name" (латиница, начинается с буквы)
  и "label" - человекочитаемая подпись.
- Все "name" внутри формы должны быть строго уникальными.
- Поля dropdown, radiogroup и checkbox обязаны содержать "choices" -
  непустой массив объектов строго в формате `{"value": "...", "text": "..."}`.
- Не изменяй части формы, о которых пользователь не просил.
- Необязательные поля ("visibleIf", "placeholder", "validation")
  добавляй только если пользователь прямо об этом попросил,
  иначе просто опусти их.

### Правила для "visibleIf"

- Ставь его только тому полю, о котором просил пользователь,
  и не добавляй его остальным полям и страницам.
- поле не может зависеть от самого себя: в "field" всегда имя другого поля.
- Для проверки "заполнено" и "не заполнено" используй
  операторы "notEmpty" и "empty" без "value".
- Либо полное условие, либо поля нет - пустой объект недопустим.

### Статусы ответа

- Если пользователь просит возможность, которой нет в текущей структуре формы,
  верни status="unsupported".
- Если запрос невозможно однозначно выполнить, верни status="ambiguous".
- Если запрос можно выполнить, верни status="ok" и полную
  изменённую форму в поле "form".

В поле "message" коротко опиши на русском, что было сделано
или почему запрос не выполнен. Сформируй содержательное описание.
```

### 4.2. Пользовательское сообщение

Шаблон `prompts/ai-constructor.user.md`:

```markdown
Текущая форма:

{{form}}

Пожелание пользователя:

{{prompt}}
```

`{{form}}` - это `JSON.stringify(form.schema, null, 2)`, то есть текущая схема формы
из БД как есть. Реальный результат для формы с одним полем:

```markdown
Текущая форма:

{
"pages": [
{
"name": "page1",
"elements": [
{
"name": "satisfied",
"label": "Довольны ли вы сервисом?",
"required": true,
"type": "radiogroup",
"choices": [
{ "value": "yes", "text": "Да" },
{ "value": "no", "text": "Нет" }
]
}
]
}
]
}

Пожелание пользователя:

добавь поле для комментария, которое появляется если выбрали "Нет"
```

Получившийся `StructuredRequest` уходит в `ai.service`:

```ts
return await ai.ask({
  name: "ai_form_constructor",
  schema: aiResponseSchema,
  messages: [
    { role: "system", content: systemMessage },
    { role: "user", content: userMessage },
  ],
});
```

---

## 5. Шаг 3. Схема ответа: zod → JSON Schema → strict

Это самая содержательная часть пути. На вход - zod, на выход - JSON, который
согласится принять OpenAI в режиме `strict: true`.

### 5.0. Что за схема

`modules/form/ai/ai-constructor.types.ts`:

```ts
export const aiResponseSchema = z.object({
  status: z.enum(["ok", "unsupported", "ambiguous"]),
  message: z.string(),
  form: formSchemaObject.optional(),
});
```

`formSchemaObject` - это обычная схема формы из `modules/form/schema/form-schema.schema.ts`,
та же самая, которой валидируется форма при ручном редактировании.
Внутри у неё есть две неудобные для OpenAI конструкции:

- **дискриминированное объединение** типов полей (`z.discriminatedUnion("type", [...])`)
  → `oneOf` в JSON Schema;
- **рекурсия** в условиях видимости (`conditionSchema` через `z.lazy`, где `and`/`or`
  содержат массив таких же условий) → `$ref` на самого себя.

### 5.1. `toJsonSchema`

`ai.service.ts`:

```ts
const jsonSchemaCache = new WeakMap<z.ZodType, Record<string, unknown>>();

function toJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const cached = jsonSchemaCache.get(schema);
  if (cached) return cached;
  const { $schema: _ignored, ...jsonSchema } = z.toJSONSchema(schema, {
    io: "input",
    target: "draft-7",
  });
  const strict = toStrictJsonSchema(jsonSchema);
  jsonSchemaCache.set(schema, strict);
  return strict;
}
```

- `io: "input"` - берётся **входная** сторона схемы. Для `required: z.boolean().default(false)`
  это значит "поле необязательное", а не "boolean с гарантированным значением".
- `target: "draft-7"` - определения складываются в `definitions`, а не в `$defs`.
- `$schema` вырезается: OpenAI считает его лишним полем и отклоняет схему целиком.
- `WeakMap` по объекту схемы.

### 5.2. Что выдаёт `z.toJSONSchema`

Ветка текстового поля (`text | email | textarea`) - до строгого режима:

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100,
      "pattern": "^[a-zA-Z][a-zA-Z0-9_-]*$"
    },
    "label": {
      "type": "string",
      "minLength": 1,
      "maxLength": 500
    },
    "required": {
      "default": false,
      "type": "boolean"
    },
    "placeholder": {
      "type": "string"
    },
    "visibleIf": {
      "allOf": [
        {
          "$ref": "#/definitions/__schema0"
        }
      ]
    },
    "type": {
      "type": "string",
      "enum": ["text", "email", "textarea"]
    },
    "validation": {
      "type": "object",
      "properties": {
        "minLength": {
          "type": "integer",
          "minimum": 0,
          "maximum": 9007199254740991
        },
        "maxLength": {
          "type": "integer",
          "exclusiveMinimum": 0,
          "maximum": 9007199254740991
        }
      }
    }
  },
  "required": ["name", "label", "type"]
}
```

Здесь видно всё, что дальше придётся чинить: `required` перечисляет только
три поля из семи, `visibleIf` - ссылка, обёрнутая в `allOf`, а сам объект
не запрещает лишние ключи.

Условие видимости вынесено в `definitions` и ссылается на себя:

```json
{
  "definitions": {
    "__schema0": {
      "anyOf": [
        {
          "type": "object",
          "properties": {
            "field": {
              "type": "string",
              "minLength": 1,
              "maxLength": 100,
              "pattern": "^[a-zA-Z][a-zA-Z0-9_-]*$"
            },
            "operator": {
              "type": "string",
              "enum": [
                "equals",
                "notEquals",
                "greaterThan",
                "greaterThanOrEqual",
                "lessThan",
                "lessThanOrEqual",
                "contains",
                "notContains",
                "empty",
                "notEmpty"
              ]
            },
            "value": {
              "anyOf": [
                {
                  "type": "string"
                },
                {
                  "type": "number"
                },
                {
                  "type": "boolean"
                },
                {
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                }
              ]
            }
          },
          "required": ["field", "operator"]
        },
        {
          "type": "object",
          "properties": {
            "and": {
              "minItems": 1,
              "type": "array",
              "items": {
                "$ref": "#/definitions/__schema0"
              }
            }
          },
          "required": ["and"]
        },
        {
          "type": "object",
          "properties": {
            "or": {
              "minItems": 1,
              "type": "array",
              "items": {
                "$ref": "#/definitions/__schema0"
              }
            }
          },
          "required": ["or"]
        }
      ]
    }
  }
}
```

А в месте использования стоит ссылка на него:

```json
{
  "allOf": [
    {
      "$ref": "#/definitions/__schema0"
    }
  ]
}
```

### 5.3. `toStrictJsonSchema` - что и зачем меняется

`strict-schema.formatter.ts` - снимает `definitions` с верхнего уровня
и рекурсивно обходит остальное, передавая определения дальше по схеме:

```ts
export function toStrictJsonSchema(schema: JsonSchema): JsonSchema {
  const { definitions, $defs, ...root } = schema;
  const strictSchema = toStrictSchema(
    root,
    (definitions ?? $defs ?? {}) as Record<string, JsonSchema>,
    0,
  );
  if (!strictSchema) throw new Error("Схему невозможно развернуть");
  return strictSchema;
}
```

`definitions` в результат не попадают - их содержимое подставляется по месту.
OpenAI в strict-режиме `$ref` не поддерживает, поэтому схема
должна быть развёрнутой.

Дальше по функциям.

#### `unwrapAllOfWrapper` - снять обёртку allOf

zod иногда заворачивает схему в `allOf` из одного элемента. Настоящего "И"
здесь нет - внутри лежит та же самая схема:

```ts
if (!allOf || allOf.length !== 1 || Object.keys(schema).length !== 1) {
  return schema;
}
return allOf[0];
```

Условие `Object.keys(schema).length !== 1` проверяет, что рядом с `allOf` нет
других ключей: если есть, обёртка несёт смысл, и снимать её нельзя.

| до                                           | после                         |
| -------------------------------------------- | ----------------------------- |
| `{ "allOf": [{ "$ref": "#/…/__schema0" }] }` | `{ "$ref": "#/…/__schema0" }` |

Без этого шага следующая же строка (`if ("$ref" in schema)`) ссылку бы
не заметила, и она уехала бы в OpenAI как есть.

#### `toStrictSchema` - подстановка ссылок и ограничение рекурсии

```ts
if ("$ref" in schema) {
  const referenced = definitions[definitionName(schema.$ref as string)];
  return depth < MAX_REFERENCE_DEPTH && referenced
    ? toStrictSchema(referenced, definitions, depth + 1)
    : null;
}
```

`depth` считает, сколько раз схему уже подставили внутрь самой себя.
Возврат `null` означает "эту схему развернуть нельзя" - и она **выбрасывается**,
а не ломает схему целиком: в `toStrictObject` необязательное поле просто пропускается,
а обязательное обнуляет весь объект.

Ещё две вещи в той же функции:

- `oneOf`/`anyOf`/`allOf` схлопываются в один `anyOf`
  (`const variants = (oneOf ?? anyOf ?? allOf)`), потому что OpenAI из трёх
  ключевых слов понимает только `anyOf`. Для дискриминированного объединения
  это безопасно: ветки различаются литералом `type`, так что `anyOf` и `oneOf`
  дают один и тот же набор допустимых значений;
- `default` выбрасывается деструктуризацией (`const { default: _default, ... }`) -
  strict-режим его не принимает. Значение по умолчанию всё равно проставит zod
  на разборе ответа.

#### `toStrictObject` - строгий объект

```ts
strictProperties[name] = requiredNames.has(name)
  ? strictProperty
  : { anyOf: [strictProperty, nullSchema] };

return {
  ...objectSchema,
  additionalProperties: false,
  required: Object.keys(strictProperties),
  properties: strictProperties,
};
```

Три правки:

1. `additionalProperties: false` - ИИ модель не может дописать поле от себя;
2. `required` перечисляет **все** свойства - этого требует strict-режим;
3. чтобы пункт 2 не сделал необязательные поля по-настоящему обязательными,
   каждому из них разрешается быть `null`.

Смысл третьего пункта: ИИ модель обязана явно написать `"placeholder": null`,
а не промолчать. Разница практическая - "промолчал" неотличимо от "забыл",
а `null` - это ответ. Обратно в необязательность их вернёт `dropNulls` (см. 8.3).

### 5.4. Результат: то же текстовое поле после строгого режима

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100,
      "pattern": "^[a-zA-Z][a-zA-Z0-9_-]*$"
    },
    "label": {
      "type": "string",
      "minLength": 1,
      "maxLength": 500
    },
    "required": {
      "anyOf": [
        {
          "type": "boolean"
        },
        {
          "type": "null"
        }
      ]
    },
    "placeholder": {
      "anyOf": [
        {
          "type": "string"
        },
        {
          "type": "null"
        }
      ]
    },
    "visibleIf": "/* см. см. 5.4 */",
    "type": {
      "type": "string",
      "enum": ["text", "email", "textarea"]
    },
    "validation": {
      "anyOf": [
        {
          "type": "object",
          "properties": {
            "minLength": {
              "anyOf": [
                {
                  "type": "integer",
                  "minimum": 0,
                  "maximum": 9007199254740991
                },
                {
                  "type": "null"
                }
              ]
            },
            "maxLength": {
              "anyOf": [
                {
                  "type": "integer",
                  "exclusiveMinimum": 0,
                  "maximum": 9007199254740991
                },
                {
                  "type": "null"
                }
              ]
            }
          },
          "additionalProperties": false,
          "required": ["minLength", "maxLength"]
        },
        {
          "type": "null"
        }
      ]
    }
  },
  "required": [
    "name",
    "label",
    "required",
    "placeholder",
    "visibleIf",
    "type",
    "validation"
  ],
  "additionalProperties": false
}
```

Сравнение по строкам:

| Было (`z.toJSONSchema`)               | Стало                                      | Кто и зачем                               |
| ------------------------------------- | ------------------------------------------ | ----------------------------------------- |
| `required: ["name","label","type"]`   | `required: [все 7 свойств]`                | `toStrictObject`, требование openAI       |
| `placeholder: {type:"string"}`        | `anyOf: [{type:"string"}, {type:"null"}]`  | `toStrictObject`, п.3                     |
| `required: {default:false, type:...}` | `anyOf: [{type:"boolean"}, {type:"null"}]` | `toStrictSchema` снял `default`           |
| нет `additionalProperties`            | `additionalProperties: false`              | `toStrictObject`, п.1                     |
| `oneOf: [...]` у списка элементов     | `anyOf: [...]`                             | `toStrictSchema`, OpenAI не знает `oneOf` |
| `visibleIf: {allOf:[{$ref}]}`         | развёрнутое условие или `null`             | `unwrapAllOfWrapper` + `toStrictSchema`   |

И само `visibleIf` после разворачивания:

```json
{
  "anyOf": [
    {
      "anyOf": [
        {
          "type": "object",
          "properties": {
            "field": {
              "type": "string",
              "minLength": 1,
              "maxLength": 100,
              "pattern": "^[a-zA-Z][a-zA-Z0-9_-]*$"
            },
            "operator": {
              "type": "string",
              "enum": [
                "equals",
                "notEquals",
                "greaterThan",
                "greaterThanOrEqual",
                "lessThan",
                "lessThanOrEqual",
                "contains",
                "notContains",
                "empty",
                "notEmpty"
              ]
            },
            "value": {
              "anyOf": [
                {
                  "anyOf": [
                    {
                      "type": "string"
                    },
                    {
                      "type": "number"
                    },
                    {
                      "type": "boolean"
                    },
                    {
                      "type": "array",
                      "items": {
                        "type": "string"
                      }
                    }
                  ]
                },
                {
                  "type": "null"
                }
              ]
            }
          },
          "required": ["field", "operator", "value"],
          "additionalProperties": false
        }
      ]
    },
    {
      "type": "null"
    }
  ]
}
```

---

## 6. Шаг 4. Тело HTTP-запроса в OpenAI

```ts
function buildRequestBody(config, request) {
  return {
    model: config.model,
    messages: request.messages,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: request.name,
        strict: true,
        schema: toJsonSchema(request.schema),
      },
    },
  };
}
```

`name` - это `"ai_form_constructor"` из `AI_CONSTRUCTOR_TASK`: имя схемы, которое OpenAI показывает в ошибках валидации.

Отправка (`shared/http/http-request.ts`):

```
POST https://api.openai.com/v1/chat/completions
Authorization: Bearer <AI_API_KEY>
Content-Type: application/json
```

`sendHttpRequest` ставит `AbortSignal.timeout(config.timeoutMs)` - таймаут
из `AI_TIMEOUT_MS`.

Итоговое тело (схема свёрнута, полностью - см. 10):

```json
{
  "model": "gpt-4o-mini",
  "messages": [
    { "role": "system", "content": "Ты - конструктор форм.\n\n…" },
    {
      "role": "user",
      "content": "Текущая форма:\n\n{…}\n\nПожелание пользователя:\n\nдобавь поле…"
    }
  ],
  "response_format": {
    "type": "json_schema",
    "json_schema": {
      "name": "ai_form_constructor",
      "strict": true,
      "schema": { "…": "см. приложение см. 12" }
    }
  }
}
```

---

## 7. Шаг 5. Что возвращает OpenAI

### 7.1. Успех

```json
{
  "id": "chatcmpl-Bq7x2",
  "object": "chat.completion",
  "created": 1756400000,
  "model": "gpt-4o-mini-2024-07-18",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "refusal": null,
        "content": "{\"status\":\"ok\",\"message\":\"Добавил поле Комментарий…\",\"form\":{…}}"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 1841,
    "completion_tokens": 214,
    "total_tokens": 2055
  }
}
```

`content` - это **строка**, а не объект. `json_schema` гарантирует, что внутри
строки лежит валидный по схеме JSON, но распаковывать её всё равно приходится нам.

Распакованный `content` для нашего примера (`null` здесь поставил strict-режим,
см. 5.3):

```json
{
  "status": "ok",
  "message": "Добавил поле Комментарий и показал его только при выборе Нет.",
  "form": {
    "pages": [
      {
        "name": "page1",
        "title": null,
        "visibleIf": null,
        "elements": [
          {
            "name": "satisfied",
            "label": "Довольны ли вы сервисом?",
            "required": true,
            "placeholder": null,
            "visibleIf": null,
            "type": "radiogroup",
            "choices": [
              { "value": "yes", "text": "Да" },
              { "value": "no", "text": "Нет" }
            ]
          },
          {
            "name": "comment",
            "label": "Что можно улучшить?",
            "required": null,
            "placeholder": "Ваш комментарий",
            "visibleIf": {
              "field": "satisfied",
              "operator": "equals",
              "value": "no"
            },
            "type": "textarea",
            "validation": { "minLength": null, "maxLength": 1000 }
          }
        ]
      }
    ]
  }
}
```

### 7.2. Отказ модели

При срабатывании safety-фильтров OpenAI кладёт текст в `refusal`, а `content`
делает `null`:

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": null,
        "refusal": "I'm sorry…"
      }
    }
  ]
}
```

Код `refusal` не читает: `completionSchema` описывает только `content`, а `null`
приводит к "Empty or unexpected response" → `503`.

### 7.3. Ошибки API

```json
{
  "error": {
    "message": "Rate limit reached for gpt-4o-mini",
    "type": "rate_limit_error",
    "code": "rate_limit_exceeded"
  }
}
```

Код не разбирает тело ошибки - оно целиком уходит в лог как строка.

---

## 8. Шаг 6. Разбор ответа

```ts
async function ask(request) {
  const content = await checkAnswerIsReady(request);
  const formattedJson = dropNulls(parseJson(content));
  const parsed = request.schema.safeParse(formattedJson);
  if (!parsed.success)
    throw throwServiceError("Answer validation error", parsed.error.issues);
  return parsed.data;
}
```

### 8.1. `checkAnswerIsReady` - статус и ретраи

```ts
if (response.status === TOO_MANY_REQUESTS && attempt <= MAX_RETRIES) {
  await wait(incrementDelayMs(response, attempt));
  return await checkAnswerIsReady(request, attempt + 1);
}
```

Ретраится **только 429**, максимум 2 раза.
Пауза берётся из заголовка `Retry-After` (в секундах).
`5xx` не ретраится вовсе.

Затем `extractContent` разбирает ответ:

```ts
export const completionSchema = z.object({
  choices: z
    .array(z.object({ message: z.object({ content: z.string().nullable() }) }))
    .min(1),
});
```

Схема нарочно минимальная: код читает только `choices[0].message.content`.

### 8.2. `parseJson` - снять markdown-обёртку

````ts
const fenced = /^\s*```(?:json)?\s*\n([\s\S]*?)\n\s*```\s*$/.exec(content);
return JSON.parse(fenced?.[1] ?? content);
````

Страховка на случай, когда ИИ модель всё-таки оборачивает ответ в markdown-блок `json`.

### 8.3. `dropNulls` - вернуть необязательность

```ts
function dropNulls(value) {
  if (Array.isArray(value)) return value.map(dropNulls);
  if (value === null || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => item !== null)
      .map(([key, item]) => [key, dropNulls(item)]),
  );
}
```

Это зеркало правки из см. 5.3. Мы заставили ИИ модель писать `null` вместо
молчания - здесь эти `null` снимаются, и объект снова соответствует исходной
zod-схеме, где поля просто `.optional()`.

Работает рекурсивно и по массивам, так что `validation: { minLength: null, maxLength: 1000 }`
превращается в `{ maxLength: 1000 }`, а не остаётся с дыркой.

### 8.4. `safeParse` - та же схема, что ушла в OpenAI

Валидируется исходной zod-схемой, а не JSON Schema: JSON Schema - урезанная
проекция, а zod проверяет ещё и то, что в неё не пролезло - в первую очередь
`superRefine` с уникальностью `name`.

Здесь же применяются `.default()`: `required: null` → поле удалено `dropNulls`
→ zod подставляет `false`.

Реальный результат `ask()` для ответа из см. 7.1:

```json
{
  "status": "ok",
  "message": "Добавил поле Комментарий и показал его только при выборе Нет.",
  "form": {
    "pages": [
      {
        "name": "page1",
        "elements": [
          {
            "name": "satisfied",
            "label": "Довольны ли вы сервисом?",
            "required": true,
            "type": "radiogroup",
            "choices": [
              { "value": "yes", "text": "Да" },
              { "value": "no", "text": "Нет" }
            ]
          },
          {
            "name": "comment",
            "label": "Что можно улучшить?",
            "required": false,
            "placeholder": "Ваш комментарий",
            "visibleIf": {
              "field": "satisfied",
              "operator": "equals",
              "value": "no"
            },
            "type": "textarea",
            "validation": { "maxLength": 1000 }
          }
        ]
      }
    ]
  }
}
```

Сравните с примером из 7.1: исчезли `title: null`, `visibleIf: null`,
`placeholder: null`, `minLength: null`; `required: null` стало `required: false`.

---

## 9. Шаг 7. Ответ клиенту

```ts
res.status(200).json({
  status: result.status,
  message: result.message,
  schema: result.form ?? null,
});
```

Поле переименовывается: внутри модуля оно `form`, наружу уходит `schema` -
так же, как оно называется в `forms.schema` в БД и в остальном API.
При `status: "unsupported"` или `"ambiguous"` ИИ модель `form` не присылает,
и клиент получает `schema: null` при HTTP `200`.

Форма **не сохраняется**. Эндпоинт возвращает предложение; записывает его
клиент отдельным `PATCH /api/forms/:id`.

```json
{
  "status": "ok",
  "message": "Добавил поле Комментарий и показал его только при выборе Нет.",
  "schema": { "pages": [ … ] }
}
```

---

## 10. Приложение. Полная схема для OpenAI

```json
{
  "type": "object",
  "properties": {
    "status": {
      "type": "string",
      "enum": ["ok", "unsupported", "ambiguous"]
    },
    "message": {
      "type": "string"
    },
    "form": {
      "anyOf": [
        {
          "type": "object",
          "properties": {
            "pages": {
              "minItems": 1,
              "maxItems": 50,
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "name": {
                    "type": "string",
                    "minLength": 1,
                    "maxLength": 100
                  },
                  "title": {
                    "anyOf": [
                      {
                        "type": "string"
                      },
                      {
                        "type": "null"
                      }
                    ]
                  },
                  "visibleIf": {
                    "anyOf": [
                      {
                        "anyOf": [
                          {
                            "type": "object",
                            "properties": {
                              "field": {
                                "type": "string",
                                "minLength": 1,
                                "maxLength": 100,
                                "pattern": "^[a-zA-Z][a-zA-Z0-9_-]*$"
                              },
                              "operator": {
                                "type": "string",
                                "enum": [
                                  "equals",
                                  "notEquals",
                                  "greaterThan",
                                  "greaterThanOrEqual",
                                  "lessThan",
                                  "lessThanOrEqual",
                                  "contains",
                                  "notContains",
                                  "empty",
                                  "notEmpty"
                                ]
                              },
                              "value": {
                                "anyOf": [
                                  {
                                    "anyOf": [
                                      {
                                        "type": "string"
                                      },
                                      {
                                        "type": "number"
                                      },
                                      {
                                        "type": "boolean"
                                      },
                                      {
                                        "type": "array",
                                        "items": {
                                          "type": "string"
                                        }
                                      }
                                    ]
                                  },
                                  {
                                    "type": "null"
                                  }
                                ]
                              }
                            },
                            "required": ["field", "operator", "value"],
                            "additionalProperties": false
                          }
                        ]
                      },
                      {
                        "type": "null"
                      }
                    ]
                  },
                  "elements": {
                    "maxItems": 200,
                    "type": "array",
                    "items": {
                      "anyOf": [
                        {
                          "type": "object",
                          "properties": {
                            "name": {
                              "type": "string",
                              "minLength": 1,
                              "maxLength": 100,
                              "pattern": "^[a-zA-Z][a-zA-Z0-9_-]*$"
                            },
                            "label": {
                              "type": "string",
                              "minLength": 1,
                              "maxLength": 500
                            },
                            "required": {
                              "anyOf": [
                                {
                                  "type": "boolean"
                                },
                                {
                                  "type": "null"
                                }
                              ]
                            },
                            "placeholder": {
                              "anyOf": [
                                {
                                  "type": "string"
                                },
                                {
                                  "type": "null"
                                }
                              ]
                            },
                            "visibleIf": {
                              "anyOf": [
                                {
                                  "anyOf": [
                                    {
                                      "type": "object",
                                      "properties": {
                                        "field": {
                                          "type": "string",
                                          "minLength": 1,
                                          "maxLength": 100,
                                          "pattern": "^[a-zA-Z][a-zA-Z0-9_-]*$"
                                        },
                                        "operator": {
                                          "type": "string",
                                          "enum": [
                                            "equals",
                                            "notEquals",
                                            "greaterThan",
                                            "greaterThanOrEqual",
                                            "lessThan",
                                            "lessThanOrEqual",
                                            "contains",
                                            "notContains",
                                            "empty",
                                            "notEmpty"
                                          ]
                                        },
                                        "value": {
                                          "anyOf": [
                                            {
                                              "anyOf": [
                                                {
                                                  "type": "string"
                                                },
                                                {
                                                  "type": "number"
                                                },
                                                {
                                                  "type": "boolean"
                                                },
                                                {
                                                  "type": "array",
                                                  "items": {
                                                    "type": "string"
                                                  }
                                                }
                                              ]
                                            },
                                            {
                                              "type": "null"
                                            }
                                          ]
                                        }
                                      },
                                      "required": [
                                        "field",
                                        "operator",
                                        "value"
                                      ],
                                      "additionalProperties": false
                                    }
                                  ]
                                },
                                {
                                  "type": "null"
                                }
                              ]
                            },
                            "type": {
                              "type": "string",
                              "enum": ["text", "email", "textarea"]
                            },
                            "validation": {
                              "anyOf": [
                                {
                                  "type": "object",
                                  "properties": {
                                    "minLength": {
                                      "anyOf": [
                                        {
                                          "type": "integer",
                                          "minimum": 0,
                                          "maximum": 9007199254740991
                                        },
                                        {
                                          "type": "null"
                                        }
                                      ]
                                    },
                                    "maxLength": {
                                      "anyOf": [
                                        {
                                          "type": "integer",
                                          "exclusiveMinimum": 0,
                                          "maximum": 9007199254740991
                                        },
                                        {
                                          "type": "null"
                                        }
                                      ]
                                    }
                                  },
                                  "additionalProperties": false,
                                  "required": ["minLength", "maxLength"]
                                },
                                {
                                  "type": "null"
                                }
                              ]
                            }
                          },
                          "required": [
                            "name",
                            "label",
                            "required",
                            "placeholder",
                            "visibleIf",
                            "type",
                            "validation"
                          ],
                          "additionalProperties": false
                        },
                        {
                          "type": "object",
                          "properties": {
                            "name": {
                              "type": "string",
                              "minLength": 1,
                              "maxLength": 100,
                              "pattern": "^[a-zA-Z][a-zA-Z0-9_-]*$"
                            },
                            "label": {
                              "type": "string",
                              "minLength": 1,
                              "maxLength": 500
                            },
                            "required": {
                              "anyOf": [
                                {
                                  "type": "boolean"
                                },
                                {
                                  "type": "null"
                                }
                              ]
                            },
                            "placeholder": {
                              "anyOf": [
                                {
                                  "type": "string"
                                },
                                {
                                  "type": "null"
                                }
                              ]
                            },
                            "visibleIf": {
                              "anyOf": [
                                {
                                  "anyOf": [
                                    {
                                      "type": "object",
                                      "properties": {
                                        "field": {
                                          "type": "string",
                                          "minLength": 1,
                                          "maxLength": 100,
                                          "pattern": "^[a-zA-Z][a-zA-Z0-9_-]*$"
                                        },
                                        "operator": {
                                          "type": "string",
                                          "enum": [
                                            "equals",
                                            "notEquals",
                                            "greaterThan",
                                            "greaterThanOrEqual",
                                            "lessThan",
                                            "lessThanOrEqual",
                                            "contains",
                                            "notContains",
                                            "empty",
                                            "notEmpty"
                                          ]
                                        },
                                        "value": {
                                          "anyOf": [
                                            {
                                              "anyOf": [
                                                {
                                                  "type": "string"
                                                },
                                                {
                                                  "type": "number"
                                                },
                                                {
                                                  "type": "boolean"
                                                },
                                                {
                                                  "type": "array",
                                                  "items": {
                                                    "type": "string"
                                                  }
                                                }
                                              ]
                                            },
                                            {
                                              "type": "null"
                                            }
                                          ]
                                        }
                                      },
                                      "required": [
                                        "field",
                                        "operator",
                                        "value"
                                      ],
                                      "additionalProperties": false
                                    }
                                  ]
                                },
                                {
                                  "type": "null"
                                }
                              ]
                            },
                            "type": {
                              "type": "string",
                              "const": "number"
                            },
                            "validation": {
                              "anyOf": [
                                {
                                  "type": "object",
                                  "properties": {
                                    "min": {
                                      "anyOf": [
                                        {
                                          "type": "number"
                                        },
                                        {
                                          "type": "null"
                                        }
                                      ]
                                    },
                                    "max": {
                                      "anyOf": [
                                        {
                                          "type": "number"
                                        },
                                        {
                                          "type": "null"
                                        }
                                      ]
                                    }
                                  },
                                  "additionalProperties": false,
                                  "required": ["min", "max"]
                                },
                                {
                                  "type": "null"
                                }
                              ]
                            }
                          },
                          "required": [
                            "name",
                            "label",
                            "required",
                            "placeholder",
                            "visibleIf",
                            "type",
                            "validation"
                          ],
                          "additionalProperties": false
                        },
                        {
                          "type": "object",
                          "properties": {
                            "name": {
                              "type": "string",
                              "minLength": 1,
                              "maxLength": 100,
                              "pattern": "^[a-zA-Z][a-zA-Z0-9_-]*$"
                            },
                            "label": {
                              "type": "string",
                              "minLength": 1,
                              "maxLength": 500
                            },
                            "required": {
                              "anyOf": [
                                {
                                  "type": "boolean"
                                },
                                {
                                  "type": "null"
                                }
                              ]
                            },
                            "placeholder": {
                              "anyOf": [
                                {
                                  "type": "string"
                                },
                                {
                                  "type": "null"
                                }
                              ]
                            },
                            "visibleIf": {
                              "anyOf": [
                                {
                                  "anyOf": [
                                    {
                                      "type": "object",
                                      "properties": {
                                        "field": {
                                          "type": "string",
                                          "minLength": 1,
                                          "maxLength": 100,
                                          "pattern": "^[a-zA-Z][a-zA-Z0-9_-]*$"
                                        },
                                        "operator": {
                                          "type": "string",
                                          "enum": [
                                            "equals",
                                            "notEquals",
                                            "greaterThan",
                                            "greaterThanOrEqual",
                                            "lessThan",
                                            "lessThanOrEqual",
                                            "contains",
                                            "notContains",
                                            "empty",
                                            "notEmpty"
                                          ]
                                        },
                                        "value": {
                                          "anyOf": [
                                            {
                                              "anyOf": [
                                                {
                                                  "type": "string"
                                                },
                                                {
                                                  "type": "number"
                                                },
                                                {
                                                  "type": "boolean"
                                                },
                                                {
                                                  "type": "array",
                                                  "items": {
                                                    "type": "string"
                                                  }
                                                }
                                              ]
                                            },
                                            {
                                              "type": "null"
                                            }
                                          ]
                                        }
                                      },
                                      "required": [
                                        "field",
                                        "operator",
                                        "value"
                                      ],
                                      "additionalProperties": false
                                    }
                                  ]
                                },
                                {
                                  "type": "null"
                                }
                              ]
                            },
                            "type": {
                              "type": "string",
                              "enum": ["dropdown", "radiogroup", "checkbox"]
                            },
                            "choices": {
                              "minItems": 1,
                              "type": "array",
                              "items": {
                                "type": "object",
                                "properties": {
                                  "value": {
                                    "type": "string"
                                  },
                                  "text": {
                                    "type": "string"
                                  }
                                },
                                "required": ["value", "text"],
                                "additionalProperties": false
                              }
                            }
                          },
                          "required": [
                            "name",
                            "label",
                            "required",
                            "placeholder",
                            "visibleIf",
                            "type",
                            "choices"
                          ],
                          "additionalProperties": false
                        }
                      ]
                    }
                  }
                },
                "required": ["name", "title", "visibleIf", "elements"],
                "additionalProperties": false
              }
            }
          },
          "required": ["pages"],
          "additionalProperties": false
        },
        {
          "type": "null"
        }
      ]
    }
  },
  "required": ["status", "message", "form"],
  "additionalProperties": false
}
```
