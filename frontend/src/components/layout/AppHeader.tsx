import { useI18n } from "../../i18n/useI18n";
import LanguageSwitcher from "../ui/LanguageSwitcher";
import TitleBlock from "./TitleBlock";

interface AppHeaderProps {
  total: number;
  completed: number;
  /** False until the first load ends (see TitleBlock). */
  ready?: boolean;
}

function AppHeader({ total, completed, ready = true }: AppHeaderProps) {
  const { t } = useI18n();

  return (
    <header>
      <div className="flex items-center justify-between gap-4">
        <p className="min-w-0 font-mono text-[11px] font-medium tracking-[0.08em] text-balance text-brand uppercase sm:tracking-[0.14em]">
          {t.header.overline}
        </p>
        <LanguageSwitcher />
      </div>

      <div className="mt-4">
        <h1 className="text-[2rem] leading-none font-semibold tracking-tight text-ink sm:text-[2.25rem]">
          {t.header.title}
        </h1>
        <p className="mt-2.5 text-sm text-ink-soft">{t.header.subtitle}</p>
      </div>

      <div className="mt-7">
        <TitleBlock total={total} completed={completed} ready={ready} />
      </div>
    </header>
  );
}

export default AppHeader;
