import { z } from "zod";

export const selectionMapSchema = z.record(z.string(), z.string());

export const optionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
  priceDeltaCents: z.number().int(),
  leadTimeDaysDelta: z.number().int().default(0),
});

export const optionGroupSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]*$/),
  label: z.string().min(1),
  description: z.string().min(1),
  required: z.boolean().default(true),
  defaultValue: z.string().min(1),
  options: z.array(optionSchema).min(1),
});

export const configurationRuleSchema = z.object({
  type: z.literal("REQUIRES_ONE_OF"),
  when: z.object({ field: z.string(), equals: z.string() }),
  target: z.object({ field: z.string(), allowed: z.array(z.string()).min(1) }),
  reason: z.string().min(1),
});

export const productBlueprintDefinitionSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  summary: z.string().min(1),
  schemaVersion: z.number().int().positive(),
  rulesVersion: z.string().min(1),
  currency: z.string().length(3),
  basePriceCents: z.number().int().nonnegative(),
  baseLeadTimeDays: z.number().int().positive(),
  depositRate: z.number().min(0).max(1),
  optionGroups: z.array(optionGroupSchema).min(1),
  rules: z.array(configurationRuleSchema),
});

export type SelectionMap = z.infer<typeof selectionMapSchema>;
export type ProductBlueprintDefinition = z.infer<typeof productBlueprintDefinitionSchema>;

export type ConfigurationIssue = {
  field: string;
  code: "UNKNOWN_SELECTION" | "MISSING_SELECTION" | "INVALID_OPTION" | "RULE_VIOLATION";
  message: string;
};

export type PriceTraceLine = {
  code: string;
  label: string;
  amountCents: number;
};

export type PriceTrace = {
  currency: string;
  rulesVersion: string;
  basePriceCents: number;
  lines: PriceTraceLine[];
  totalCents: number;
  depositCents: number;
  leadTimeDays: number;
};

export const referenceFurnitureBlueprint = productBlueprintDefinitionSchema.parse({
  id: "bp_oak_line_desk",
  slug: "oak-line-desk",
  name: "Oak Line Desk",
  summary:
    "A made-to-order work desk that demonstrates dimensions, material rules, live commercial trace, deposit readiness, and production release.",
  schemaVersion: 1,
  rulesVersion: "oak-line-rules@1.0.0",
  currency: "USD",
  basePriceCents: 95000,
  baseLeadTimeDays: 21,
  depositRate: 0.4,
  optionGroups: [
    {
      key: "width",
      label: "Worktop width",
      description: "Choose the working span. This affects electrical accessory eligibility.",
      required: true,
      defaultValue: "160",
      options: [
        { value: "120", label: "120 cm", priceDeltaCents: 0, leadTimeDaysDelta: 0 },
        { value: "160", label: "160 cm", priceDeltaCents: 24000, leadTimeDaysDelta: 0 },
        { value: "200", label: "200 cm", priceDeltaCents: 48000, leadTimeDaysDelta: 3 },
      ],
    },
    {
      key: "depth",
      label: "Worktop depth",
      description: "Deeper worktops provide space for the floating-frame base.",
      required: true,
      defaultValue: "75",
      options: [
        { value: "60", label: "60 cm", priceDeltaCents: 0, leadTimeDaysDelta: 0 },
        { value: "75", label: "75 cm", priceDeltaCents: 12500, leadTimeDaysDelta: 0 },
      ],
    },
    {
      key: "timber",
      label: "Timber",
      description: "Select the production material for the worktop.",
      required: true,
      defaultValue: "oak",
      options: [
        { value: "oak", label: "European oak", priceDeltaCents: 0, leadTimeDaysDelta: 0 },
        { value: "walnut", label: "American walnut", priceDeltaCents: 38000, leadTimeDaysDelta: 7 },
      ],
    },
    {
      key: "base",
      label: "Base architecture",
      description: "Choose a simple A-frame or the deeper floating-frame base.",
      required: true,
      defaultValue: "a_frame",
      options: [
        { value: "a_frame", label: "A-frame steel", priceDeltaCents: 0, leadTimeDaysDelta: 0 },
        { value: "floating_frame", label: "Floating-frame steel", priceDeltaCents: 18000, leadTimeDaysDelta: 0 },
      ],
    },
    {
      key: "cable",
      label: "Cable system",
      description: "Electrical accessories are validated against the worktop width.",
      required: true,
      defaultValue: "none",
      options: [
        { value: "none", label: "No cable system", priceDeltaCents: 0, leadTimeDaysDelta: 0 },
        { value: "grommet", label: "Brass grommet", priceDeltaCents: 4500, leadTimeDaysDelta: 0 },
        { value: "power_rail", label: "Integrated power rail", priceDeltaCents: 16500, leadTimeDaysDelta: 3 },
      ],
    },
    {
      key: "finish",
      label: "Finish",
      description: "The finish is part of the production specification, not only visual preference.",
      required: true,
      defaultValue: "natural",
      options: [
        { value: "natural", label: "Natural hardwax oil", priceDeltaCents: 0, leadTimeDaysDelta: 0 },
        { value: "smoked", label: "Smoked hardwax oil", priceDeltaCents: 8500, leadTimeDaysDelta: 2 },
      ],
    },
  ],
  rules: [
    {
      type: "REQUIRES_ONE_OF",
      when: { field: "cable", equals: "power_rail" },
      target: { field: "width", allowed: ["160", "200"] },
      reason: "Integrated power rail requires a 160 cm or 200 cm worktop.",
    },
    {
      type: "REQUIRES_ONE_OF",
      when: { field: "base", equals: "floating_frame" },
      target: { field: "depth", allowed: ["75"] },
      reason: "Floating-frame steel requires the 75 cm worktop depth.",
    },
  ],
});
