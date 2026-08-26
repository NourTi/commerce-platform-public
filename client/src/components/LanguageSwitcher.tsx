import { Languages } from "lucide-react";
import { localeMeta, type Locale } from "@/lib/publicCopy";
import { useLanguage } from "@/contexts/LanguageContext";

const languageLabels: Record<Locale, string> = { en: "Language", fr: "Langue", ar: "اللغة" };

export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useLanguage();
  const label = languageLabels[locale];
  return <label className={`language-switcher ${className}`}><Languages size={14} aria-hidden="true" /><span className="sr-only">{label}</span><select value={locale} onChange={event => setLocale(event.target.value as Locale)} aria-label={label}>{(Object.keys(localeMeta) as Locale[]).map(code => <option key={code} value={code}>{localeMeta[code].label}</option>)}</select></label>;
}
