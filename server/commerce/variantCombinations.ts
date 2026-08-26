export type VariantOptionGroups = Record<string, string[]>;

export type VariantCombination = {
  title: string;
  skuSuffix: string;
  options: Record<string, string>;
};

function skuToken(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "OPTION";
}

export function buildVariantCombinations(groups: VariantOptionGroups): VariantCombination[] {
  const entries = Object.entries(groups).map(([name, values]) => [name.trim(), Array.from(new Set(values.map(value => value.trim()).filter(Boolean))) ] as const).filter(([, values]) => values.length);
  if (!entries.length || entries.length > 3) throw new Error("Provide between one and three option groups.");
  const count = entries.reduce((total, [, values]) => total * values.length, 1);
  if (count > 64) throw new Error("Option combinations are limited to 64 variants per action.");
  return entries.reduce<VariantCombination[]>((combinations, [name, values]) => combinations.flatMap(combination => values.map(value => {
    const options = { ...combination.options, [name]: value };
    return { options, title: Object.values(options).join(" / "), skuSuffix: Object.values(options).map(skuToken).join("-") };
  })), [{ options: {}, title: "", skuSuffix: "" }]).filter(item => item.title);
}
