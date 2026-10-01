import type { ComponentType, SVGProps } from "react";
import { LOCALES, LOCALE_INFO, type Locale } from "../../i18n/config";
import { useI18n } from "../../i18n/useI18n";
import { SpainFlag, UnitedKingdomFlag } from "./flags";

const FLAGS: Record<Locale, ComponentType<SVGProps<SVGSVGElement>>> = {
  es: SpainFlag,
  en: UnitedKingdomFlag,
};

function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t.language.label}
      className="inline-flex items-center gap-0.5 rounded-full border border-line bg-sheet p-0.5"
    >
      {LOCALES.map((code) => {
        const Flag = FLAGS[code];
        const isActive = code === locale;
        return (
          <button
            key={code}
            type="button"
            lang={code}
            aria-label={LOCALE_INFO[code].nativeName}
            aria-pressed={isActive}
            title={LOCALE_INFO[code].nativeName}
            onClick={() => setLocale(code)}
            className={`group focus-ring relative inline-flex h-7 after:absolute after:-inset-x-0.5 after:-inset-y-2 after:content-[''] cursor-pointer items-center gap-1.5 rounded-full px-1.5 font-mono sm:px-2 text-[10px] font-medium tracking-[0.14em] uppercase transition-colors duration-150 ${
              isActive ? "bg-brand-soft text-brand" : "text-ink-faint hover:text-ink-soft"
            }`}
          >
            <Flag
              className={`h-3 w-[18px] shrink-0 rounded-[2px] ring-1 ring-ink/10 transition-[filter,opacity] duration-150 ${
                isActive
                  ? ""
                  : "opacity-60 grayscale group-hover:opacity-100 group-hover:grayscale-0 group-focus-visible:opacity-100 group-focus-visible:grayscale-0"
              }`}
            />
            <span aria-hidden="true" className="hidden sm:inline">
              {code}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default LanguageSwitcher;
