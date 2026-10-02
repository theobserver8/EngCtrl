import { en, type Messages } from "./locales/en";
import { es } from "./locales/es";

export const LOCALES = ["en", "es"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "cemosa.todo.locale";

export const MESSAGES: Record<Locale, Messages> = { en, es };

interface LocaleInfo {
  /** BCP 47 tag used by Intl formatters. */
  intl: string;
  /** Name of the language written in that language (shown to every user the same way). */
  nativeName: string;
}

export const LOCALE_INFO: Record<Locale, LocaleInfo> = {
  en: { intl: "en-GB", nativeName: "English" },
  es: { intl: "es-ES", nativeName: "Español" },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * Initial locale: saved preference → English. The browser language is deliberately ignored so the
 * app always starts in English, the project's primary language, until the user picks another one.
 */
export function detectLocale(): Locale {
  return readStoredLocale() ?? DEFAULT_LOCALE;
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
