import { z } from "zod";

const conditionOperatorSchema = z.enum([
  "equals",
  "notEquals",
  "greaterThan",
  "greaterThanOrEqual",
  "lessThan",
  "lessThanOrEqual",
  "contains",
  "notContains",
  "empty",
  "notEmpty",
]);

const conditionRuleSchema = z.object({
  field: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/),

  operator: conditionOperatorSchema,

  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
  ]).optional(),
});

export type Condition =
  | z.infer<typeof conditionRuleSchema>
  | {
  and: Condition[];
}
  | {
  or: Condition[];
};

export const conditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.union([
    conditionRuleSchema,
    z.object({
      and: z.array(conditionSchema).min(1),
    }),
    z.object({
      or: z.array(conditionSchema).min(1),
    }),
  ]),
);