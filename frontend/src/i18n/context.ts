import { createContext } from "react";
import type { Locale } from "./config";
import type { Messages } from "./locales/en";

export interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Messages of the active locale. */
  t: Messages;
  formatDate: (date: Date) => string;
}

export const I18nContext = createContext<I18nContextValue | null>(null);
