import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { LOCALE_INFO, MESSAGES, detectLocale, storeLocale, type Locale } from "./config";
import { I18nContext, type I18nContextValue } from "./context";

interface I18nProviderProps {
  children: ReactNode;
  /** Forces the initial locale (useful in tests); otherwise it is detected. */
  initialLocale?: Locale;
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(() => initialLocale ?? detectLocale());

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    storeLocale(next);
  }, []);

  // Keep the document in sync so screen readers, hyphenation and the tab title follow the UI.
  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = MESSAGES[locale].meta.documentTitle;
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => {
    const dateFormatter = new Intl.DateTimeFormat(LOCALE_INFO[locale].intl, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    return {
      locale,
      setLocale,
      t: MESSAGES[locale],
      formatDate: (date) => dateFormatter.format(date),
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
