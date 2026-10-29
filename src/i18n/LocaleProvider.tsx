"use client";
import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { dictionaries, type Dictionary } from "./dictionaries";
import { localeCookieName, type Locale } from "./config";
import { GreekTranslationLayer } from "./GreekTranslationLayer";

type LocaleContextValue = { locale: Locale; dictionary: Dictionary; setLocale: (locale: Locale) => void };
const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  const locale = initialLocale;
  const setLocale = useCallback((nextLocale: Locale) => {
    if (nextLocale === locale) return;
    localStorage.setItem(localeCookieName, nextLocale);
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.assign(`/api/locale?locale=${nextLocale}&redirect=${encodeURIComponent(current)}`);
  }, [locale]);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = "ltr";
    document.documentElement.dataset.ruseeHydrated = "true";
    return () => { delete document.documentElement.dataset.ruseeHydrated; };
  }, [locale]);
  const value = useMemo(() => ({ locale, dictionary: dictionaries[locale], setLocale }), [locale, setLocale]);
  return <LocaleContext.Provider value={value}>{children}<GreekTranslationLayer locale={locale} /></LocaleContext.Provider>;
}
export function useLocale() { const value = useContext(LocaleContext); if (!value) throw new Error("useLocale must be used within LocaleProvider"); return value; }
