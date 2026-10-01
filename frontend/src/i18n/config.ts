import { en, type Messages } from "./locales/en";
import { es } from "./locales/es";

export const LOCALES = ["es", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "cemosa.todo.locale";

export const MESSAGES: Record<Locale, Messages> = { es, en };

interface LocaleInfo {
  /** BCP 47 tag used by Intl formatters. */
  intl: string;
  /** Name of the language written in that language (shown to every user the same way). */
  nativeName: string;
}

export const LOCALE_INFO: Record<Locale, LocaleInfo> = {
  es: { intl: "es-ES", nativeName: "Español" },
  en: { intl: "en-GB", nativeName: "English" },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Initial locale: saved preference → browser languages → default. */
export function detectLocale(): Locale {
  const saved = readStoredLocale();
  if (saved) return saved;

  const browserLanguages = typeof navigator === "undefined" ? [] : navigator.languages;
  for (const tag of browserLanguages) {
    const language = tag.toLowerCase().split("-")[0];
    if (isLocale(language)) return language;
  }
  return DEFAULT_LOCALE;
}

function readStoredLocale(): Locale | null {
  try {
    const value = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(value) ? value : null;
  } catch {
    // Storage can be unavailable (private mode, blocked cookies): fall back silently.
    return null;
  }
}

export function storeLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Not persisting the preference is acceptable; the app keeps working.
  }
}
