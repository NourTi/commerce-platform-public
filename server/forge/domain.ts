import { createHash } from "node:crypto";
import {
  type ConfigurationIssue,
  type PriceTrace,
  type ProductBlueprintDefinition,
  type SelectionMap,
  productBlueprintDefinitionSchema,
} from "@shared/forge";

export type EvaluationResult = {
  isValid: boolean;
  issues: ConfigurationIssue[];
  resolvedSelections: SelectionMap;
  priceTrace: PriceTrace | null;
  fingerprint: string | null;
};

function fingerprint(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function evaluateConfiguration(
  rawBlueprint: ProductBlueprintDefinition,
  selections: SelectionMap,
): EvaluationResult {
  const blueprint = productBlueprintDefinitionSchema.parse(rawBlueprint);
  const issues: ConfigurationIssue[] = [];
  const resolvedSelections: SelectionMap = {};
  const knownFields = new Set(blueprint.optionGroups.map(group => group.key));

  for (const key of Object.keys(selections)) {
    if (!knownFields.has(key)) {
      issues.push({
        field: key,
        code: "UNKNOWN_SELECTION",
        message: `The selection '${key}' is not defined by this blueprint.`,
      });
    }
  }

  for (const group of blueprint.optionGroups) {
    const selectedValue = selections[group.key] ?? group.defaultValue;
    if (!selectedValue && group.required) {
      issues.push({
        field: group.key,
        code: "MISSING_SELECTION",
        message: `${group.label} is required.`,
      });
      continue;
    }
    const option = group.options.find(item => item.value === selectedValue);
    if (!option) {
      issues.push({
        field: group.key,
        code: "INVALID_OPTION",
        message: `'${selectedValue}' is not a valid ${group.label.toLowerCase()} option.`,
      });
      continue;
    }
    resolvedSelections[group.key] = option.value;
  }

  for (const rule of blueprint.rules) {
    if (resolvedSelections[rule.when.field] !== rule.when.equals) continue;
    if (!rule.target.allowed.includes(resolvedSelections[rule.target.field] ?? "")) {
      issues.push({
        field: rule.target.field,
        code: "RULE_VIOLATION",
        message: rule.reason,
      });
    }
  }

  if (issues.length > 0) {
    return {
      isValid: false,
      issues,
      resolvedSelections,
      priceTrace: null,
      fingerprint: null,
    };
  }

  const lines = [{ code: "BASE", label: "Base blueprint", amountCents: blueprint.basePriceCents }];
  let totalCents = blueprint.basePriceCents;
  let leadTimeDays = blueprint.baseLeadTimeDays;

  for (const group of blueprint.optionGroups) {
    const value = resolvedSelections[group.key];
    const option = group.options.find(item => item.value === value);
    if (!option) continue;
    totalCents += option.priceDeltaCents;
    leadTimeDays += option.leadTimeDaysDelta;
    lines.push({
      code: `${group.key}:${option.value}`,
      label: `${group.label} — ${option.label}`,
      amountCents: option.priceDeltaCents,
    });
  }

  const priceTrace: PriceTrace = {
    currency: blueprint.currency,
    rulesVersion: blueprint.rulesVersion,
    basePriceCents: blueprint.basePriceCents,
    lines,
    totalCents,
    depositCents: Math.round(totalCents * blueprint.depositRate),
    leadTimeDays,
  };

  return {
    isValid: true,
    issues: [],
    resolvedSelections,
    priceTrace,
    fingerprint: fingerprint({
      blueprintId: blueprint.id,
      schemaVersion: blueprint.schemaVersion,
      rulesVersion: blueprint.rulesVersion,
      selections: resolvedSelections,
      priceTrace,
    }),
  };
}
