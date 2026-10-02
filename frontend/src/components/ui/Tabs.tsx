import { useId, useImperativeHandle, useRef, useState, type KeyboardEvent, type ReactNode, type Ref } from "react";
import { formatCount } from "../../utils/format";

export interface TabItem<T extends string> {
  id: T;
  label: string;
  /** Shown next to the label once known (left out while the data is loading). */
  count?: number;
  icon?: ReactNode;
  /** Signal on the tab itself when its count changes, so changes made from another tab are noticed. */
  signalChanges?: boolean;
  panel: ReactNode;
}

export interface TabsHandle {
  focusSelectedTab: () => void;
}

interface TabsProps<T extends string> {
  /** Accessible name of the tab list. */
  label: string;
  tabs: readonly TabItem<T>[];
  selected: T;
  onSelect: (id: T) => void;
  /** Optional content on the right of the tabs (e.g. the syncing indicator). */
  aside?: ReactNode;
  ref?: Ref<TabsHandle>;
}

/**
 * Folder-style tabs over a hairline-framed panel. Follows the WAI-ARIA tabs pattern with
 * automatic activation: arrow keys, Home and End move between tabs.
 * Every panel stays mounted (inactive ones `hidden`) so rows keep their state and do not replay
 * their entrance animation when the user switches views.
 */
function Tabs<T extends string>({ label, tabs, selected, onSelect, aside, ref }: TabsProps<T>) {
  const baseId = useId();
  const tabRefs = useRef(new Map<T, HTMLButtonElement>());
  const selectedIndex = tabs.findIndex((tab) => tab.id === selected);
  const tabId = (id: T) => `${baseId}-tab-${id}`;
  const panelId = (id: T) => `${baseId}-panel-${id}`;

  useImperativeHandle(
    ref,
    () => ({ focusSelectedTab: () => tabRefs.current.get(selected)?.focus() }),
    [selected],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = tabs.length - 1;
    const targets: Partial<Record<string, number>> = {
      ArrowRight: selectedIndex === last ? 0 : selectedIndex + 1,
      ArrowLeft: selectedIndex === 0 ? last : selectedIndex - 1,
      Home: 0,
      End: last,
    };
    const next = targets[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const { id } = tabs[next];
    onSelect(id);
    tabRefs.current.get(id)?.focus();
  };

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div role="tablist" aria-label={label} onKeyDown={handleKeyDown} className="flex min-w-0 items-end gap-1">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              id={tabId(tab.id)}
              panelId={panelId(tab.id)}
              isSelected={tab.id === selected}
              onSelect={onSelect}
              buttonRef={(node) => {
                if (node) tabRefs.current.set(tab.id, node);
                else tabRefs.current.delete(tab.id);
              }}
            />
          ))}
        </div>
        {aside && <div className="pb-3">{aside}</div>}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={panelId(tab.id)}
          aria-labelledby={tabId(tab.id)}
          hidden={tab.id !== selected}
          // The entrance replays every time the panel is shown again (display: none -> block).
          // The corner under the first tab stays square so the tab flows into the frame.
          className={`rounded-control border border-line px-4 motion-safe:animate-[fade-in_var(--motion-base)_var(--ease-out-soft)] sm:px-5 ${
            selectedIndex === 0 ? "rounded-tl-none" : ""
          }`}
        >
          {tab.panel}
        </div>
      ))}
    </div>
  );
}

interface TabButtonProps<T extends string> {
  tab: TabItem<T>;
  id: string;
  panelId: string;
  isSelected: boolean;
  onSelect: (id: T) => void;
  buttonRef: (node: HTMLButtonElement | null) => void;
}

interface CountChange {
  /** Increments on every change: used as a React key to restart the animations. */
  key: number;
  direction: "up" | "down";
}

function TabButton<T extends string>({ tab, id, panelId, isSelected, onSelect, buttonRef }: TabButtonProps<T>) {
  const { count, signalChanges = false } = tab;
  // Derived during render (not in an effect) so the signal starts in the same frame as the change.
  const [previousCount, setPreviousCount] = useState(count);
  const [change, setChange] = useState<CountChange | null>(null);
  if (count !== previousCount) {
    setPreviousCount(count);
    // The first count (end of the initial load) is not a change worth signalling.
    if (signalChanges && count !== undefined && previousCount !== undefined) {
      setChange({ key: (change?.key ?? 0) + 1, direction: count > previousCount ? "up" : "down" });
    }
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      role="tab"
      id={id}
      aria-selected={isSelected}
      aria-controls={panelId}
      tabIndex={isSelected ? 0 : -1}
      onClick={() => onSelect(tab.id)}
      // -mb-px: the selected tab covers the frame's top border, opening the folder into its panel.
      className={`focus-ring relative -mb-px flex h-10 cursor-pointer items-center rounded-t-control border border-b-0 px-3 font-mono text-[11px] font-medium tracking-[0.14em] whitespace-nowrap uppercase tabular-nums transition-colors duration-(--motion-base) sm:px-4 ${
        isSelected ? "z-10 border-line bg-sheet text-ink" : "border-transparent text-ink-faint hover:text-ink-soft"
      }`}
    >
      {change && (
        <span
          key={change.key}
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 rounded-t-control ${
            change.direction === "up"
              ? "animate-[signal-add_var(--motion-signal)_var(--ease-out-soft)]"
              : "animate-[signal-remove_var(--motion-signal)_var(--ease-out-soft)]"
          }`}
        />
      )}
      <span
        aria-hidden="true"
        className={`absolute inset-x-3 -top-px h-0.5 rounded-full bg-brand transition-transform duration-(--motion-base) ease-out-soft ${
          isSelected ? "scale-x-100" : "scale-x-0"
        }`}
      />
      <span className="relative flex items-center gap-2">
        {tab.icon}
        {tab.label}
        {count !== undefined && (
          // The space is ignored by the flex layout (gap spaces it) but keeps the accessible name readable.
          <span className="flex overflow-hidden">
            {" "}·&nbsp;
            <span
              key={change?.key}
              // Rolls in from the direction of the change, like a mechanical counter.
              className={
                change === null
                  ? undefined
                  : change.direction === "up"
                    ? "motion-safe:animate-[count-up_var(--motion-base)_var(--ease-out-soft)]"
                    : "motion-safe:animate-[count-down_var(--motion-base)_var(--ease-out-soft)]"
              }
            >
              {formatCount(count)}
            </span>
          </span>
        )}
      </span>
    </button>
  );
}

export default Tabs;
