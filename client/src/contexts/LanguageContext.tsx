import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { localeMeta, type Locale } from "@/lib/publicCopy";

type LanguageValue = { locale: Locale; setLocale: (locale: Locale) => void; direction: "ltr" | "rtl" };
const LanguageContext = createContext<LanguageValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = localStorage.getItem("commerce-locale");
    return saved === "fr" || saved === "ar" ? saved : "en";
  });
  const direction = localeMeta[locale].direction;
  useEffect(() => {
    localStorage.setItem("commerce-locale", locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
  }, [locale, direction]);
  const value = useMemo(() => ({ locale, setLocale, direction }), [locale, direction]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider.");
  return context;
}
