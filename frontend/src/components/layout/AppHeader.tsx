import TitleBlock from "./TitleBlock";

interface AppHeaderProps {
  total: number;
  completed: number;
}

function AppHeader({ total, completed }: AppHeaderProps) {
  return (
    <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="font-mono text-[11px] font-medium tracking-[0.14em] text-brand uppercase">
          CEMOSA · Engineering &amp; Control
        </p>
        <h1 className="mt-3 text-[2rem] leading-none font-semibold tracking-tight text-ink sm:text-[2.25rem]">
          Task register
        </h1>
        <p className="mt-2.5 text-sm text-ink-soft">Track every item until it passes inspection.</p>
      </div>

      <TitleBlock total={total} completed={completed} />
    </header>
  );
}

export default AppHeader;
