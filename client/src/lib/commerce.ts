import type { Locale } from "./publicCopy";

const numberLocales: Record<Locale, string> = { en: "en-US", fr: "fr-FR", ar: "ar-SA" };

export function money(cents: number, locale: Locale = "en", currency = "USD") {
  return new Intl.NumberFormat(numberLocales[locale], { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}
