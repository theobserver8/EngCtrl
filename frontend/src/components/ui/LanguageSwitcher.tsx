import type { ComponentType, SVGProps } from "react";
import { LOCALES, LOCALE_INFO, type Locale } from "../../i18n/config";
import { useI18n } from "../../i18n/useI18n";
import { SpainFlag, UnitedKingdomFlag } from "./flags";

const FLAGS: Record<Locale, ComponentType<SVGProps<SVGSVGElement>>> = {
  en: UnitedKingdomFlag,
  es: SpainFlag,
};

function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const activeIndex = LOCALES.indexOf(locale);

  return (
    <div
      role="group"
      aria-label={t.language.label}
      // Equal-width columns so a single highlight can slide between the options.
      className="relative grid grid-cols-2 gap-0.5 rounded-full border border-line bg-sheet p-0.5 [view-transition-name:language-switcher]"
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0.5 left-0.5 w-[calc(50%-3px)] rounded-full bg-brand-soft transition-transform duration-(--motion-slow) ease-in-out-soft"
        // One option width plus the gap per step.
        style={{ transform: `translateX(calc(${activeIndex * 100}% + ${activeIndex * 2}px))` }}
      />
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
            className={`group focus-ring relative inline-flex h-7 cursor-pointer items-center justify-center gap-1.5 rounded-full px-1.5 font-mono text-[10px] font-medium tracking-[0.14em] uppercase transition-colors duration-(--motion-slow) after:absolute after:-inset-x-0.5 after:-inset-y-2 after:content-[''] sm:px-2 ${
              isActive ? "text-brand" : "text-ink-faint hover:text-ink-soft"
            }`}
          >
            <Flag
              className={`h-3 w-[18px] shrink-0 rounded-[2px] ring-1 ring-ink/10 transition-[filter,opacity] duration-(--motion-slow) ${
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
