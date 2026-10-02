import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { prefersReducedMotion } from "../utils/motion";
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
    storeLocale(next);
    // Crossfade the page between both languages (View Transitions API): only the texts change,
    // so only they visibly fade. Instant where unsupported or with reduced motion.
    if (typeof document.startViewTransition !== "function" || prefersReducedMotion()) {
      setLocaleState(next);
      return;
    }
    // The update must be applied synchronously inside the callback for the new snapshot.
    document.startViewTransition(() => flushSync(() => setLocaleState(next)));
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
