import {
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from "react";
import { formatCount } from "../../utils/format";
import { MOTION_MS, prefersReducedMotion } from "../../utils/motion";
import RollingNumber from "./RollingNumber";

// Mirrors --ease-in-out-soft in index.css (Web Animations take the curve, not the variable).
const EASE_IN_OUT_SOFT = "cubic-bezier(0.65, 0, 0.35, 1)";

// Colours at the unhurried hover pace; the slide in step with the wrapper's width (--motion-view).
const TAB_TRANSITION =
  "[transition:color_var(--motion-gentle)_var(--ease-in-out-soft),background-color_var(--motion-gentle)_var(--ease-in-out-soft),border-color_var(--motion-gentle)_var(--ease-in-out-soft),translate_var(--motion-view)_var(--ease-in-out-soft)]";

export interface TabItem<T extends string> {
  id: T;
  label: string;
  /** Shown next to the label once known (left out while the data is loading). */
  count?: number;
  icon?: ReactNode;
  /** Signal on the tab itself when its count changes, so changes made from another tab are noticed. */
  signalChanges?: boolean;
  /**
   * Tucked behind the tab before it, only a sliver showing, and not selectable (e.g. a view with
   * nothing to show yet). It slides out when this turns false and back in when it turns true.
   * Never set on the first tab.
   */
  collapsed?: boolean;
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
 * Every panel stays mounted so rows keep their state. Inactive panels are taken out of the flow
 * and made invisible rather than `display: none`, which would replay every entrance animation
 * inside them each time they are shown. Switching crossfades both views while the frame resizes
 * from one height to the other, so rows present in both never blink.
 */
function Tabs<T extends string>({ label, tabs, selected, onSelect, aside, ref }: TabsProps<T>) {
  const baseId = useId();
  const tabRefs = useRef(new Map<T, HTMLButtonElement>());
  const selectedIndex = tabs.findIndex((tab) => tab.id === selected);
  const tabId = (id: T) => `${baseId}-tab-${id}`;
  const panelId = (id: T) => `${baseId}-panel-${id}`;
  const frameRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef(new Map<T, HTMLDivElement>());
  // View being faded out: kept visible on top of the incoming one until the switch ends.
  const [outgoing, setOutgoing] = useState<T | null>(null);
  // Height of the frame right before a switch, animated to the new view's height after render.
  const switchFromHeight = useRef<number | null>(null);
  const running = useRef<Animation[]>([]);
  // Stops the scroll that follows a running switch (see `followScroll`).
  const stopScrollFollow = useRef<(() => void) | null>(null);

  /**
   * Scrolls from `top` to `targetTop` in step with the frame's resize (same duration and curve).
   * Left to the browser, a shrinking page clamps the scroll position: it stops early, as soon as
   * the page is no taller than the window, and halts abruptly. The page is kept tall enough
   * (min-height on <html>) for the scroll to run its whole course. Wheel or touch input hands the
   * scroll back to the user.
   */
  const followScroll = (resize: Animation, top: number, targetTop: number) => {
    const html = document.documentElement;
    let frameRequest = 0;
    let userScrolled = false;
    const onUserScroll = () => {
      userScrolled = true;
    };
    const stop = () => {
      cancelAnimationFrame(frameRequest);
      window.removeEventListener("wheel", onUserScroll);
      window.removeEventListener("touchstart", onUserScroll);
      stopScrollFollow.current = null;
    };
    const step = () => {
      if (resize.playState === "running") {
        const progress = resize.effect?.getComputedTiming().progress ?? 0;
        const current = top + (targetTop - top) * progress;
        if (!userScrolled) {
          html.style.minHeight = `${current + window.innerHeight}px`;
          window.scrollTo({ top: current, behavior: "instant" });
        }
        frameRequest = requestAnimationFrame(step);
        return;
      }
      stop();
      // Cancelled by another switch, which takes over the scroll (and the min-height) from here.
      if (resize.playState !== "finished") return;
      html.style.minHeight = "";
      if (!userScrolled) window.scrollTo({ top: targetTop, behavior: "instant" });
    };
    window.addEventListener("wheel", onUserScroll, { passive: true });
    window.addEventListener("touchstart", onUserScroll, { passive: true });
    stopScrollFollow.current = stop;
    step();
  };

  useEffect(
    () => () => {
      stopScrollFollow.current?.();
      document.documentElement.style.minHeight = "";
    },
    [],
  );

  const select = (id: T) => {
    if (id === selected) return;
    const frame = frameRef.current;
    if (frame && typeof frame.animate === "function" && !prefersReducedMotion()) {
      // Measured mid-switch too, so quick successive switches continue from where they are.
      const from = frame.getBoundingClientRect().height;
      switchFromHeight.current = from;
      // Held at this height until the resize takes over: laid out at the new view's height even
      // for a moment, a shorter page would clamp the scroll position at once (a jump to the top).
      frame.style.height = `${from}px`;
      setOutgoing(selected);
    }
    onSelect(id);
  };

  useLayoutEffect(() => {
    const frame = frameRef.current;
    const from = switchFromHeight.current;
    switchFromHeight.current = null;
    if (!frame || from === null) return;
    stopScrollFollow.current?.();
    const incoming = panelRefs.current.get(selected);
    const leaving = outgoing === null ? undefined : panelRefs.current.get(outgoing);
    // A switch interrupted midway continues from the current opacities instead of jumping.
    const interrupted = running.current.some((animation) => animation.playState === "running");
    const opacityOf = (panel: HTMLElement | undefined, fallback: number) =>
      interrupted && panel ? Number(getComputedStyle(panel).opacity) : fallback;
    const inFrom = opacityOf(incoming, 0);
    const outFrom = opacityOf(leaving, 1);
    running.current.forEach((animation) => animation.cancel());

    const timing: KeyframeAnimationOptions = { duration: MOTION_MS.view, easing: EASE_IN_OUT_SOFT };
    // The incoming panel (in flow) measured inside the held frame, so the page never shrinks
    // abruptly; it shrinks with the resize and the scroll position follows it smoothly.
    const { borderTopWidth, borderBottomWidth } = getComputedStyle(frame);
    const to =
      (incoming?.getBoundingClientRect().height ?? 0) + parseFloat(borderTopWidth) + parseFloat(borderBottomWidth);
    // Where the scroll ends: the page loses (from - to), and cannot end shorter than the window.
    // Measured on <body>, unaffected by the min-height a previous switch may still hold.
    const scrollTop = window.scrollY;
    const pageTo = Math.max(window.innerHeight, document.body.getBoundingClientRect().height - (from - to));
    const scrollTarget = Math.min(scrollTop, pageTo - window.innerHeight);
    frame.style.height = "";
    const resize = frame.animate([{ height: `${from}px` }, { height: `${to}px` }], timing);
    if (scrollTarget < scrollTop) followScroll(resize, scrollTop, scrollTarget);
    else if (document.documentElement.style.minHeight) {
      // An interrupted switch was holding the page's height: hold it at the current scroll until
      // this one ends, when the page is tall enough again (released any earlier, it would clamp).
      document.documentElement.style.minHeight = `${scrollTop + window.innerHeight}px`;
      resize.finished.then(() => (document.documentElement.style.minHeight = ""), () => undefined);
    }
    const fadeIn = incoming?.animate([{ opacity: inFrom }, { opacity: 1 }], timing);
    // Holds opacity 0 until the next switch cancels it: the panel is only made invisible on the
    // next render, and without the fill it would flash fully opaque for a frame in between.
    const fadeOut = leaving?.animate([{ opacity: outFrom }, { opacity: 0 }], { ...timing, fill: "forwards" });
    running.current = [resize, fadeIn, fadeOut].filter((animation) => animation !== undefined);
    // Cancelled (another switch started) also rejects `finished`: only a completed switch clears it.
    resize.finished.then(() => setOutgoing(null), () => undefined);
    // Runs only when the selection changes; `outgoing` is set in the same update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  // A selected tab that collapses hands the selection (and the focus, if it had it) to the first
  // available one: a tucked-away tab cannot stay open. Before paint, so the frame still measures
  // the outgoing view and the switch is animated as usual.
  const selectedCollapsed = tabs[selectedIndex]?.collapsed ?? false;
  useLayoutEffect(() => {
    if (!selectedCollapsed) return;
    const fallback = tabs.find((tab) => !tab.collapsed);
    if (!fallback) return;
    const hadFocus = document.activeElement === tabRefs.current.get(selected);
    select(fallback.id);
    if (hadFocus) tabRefs.current.get(fallback.id)?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCollapsed]);

  useImperativeHandle(
    ref,
    () => ({ focusSelectedTab: () => tabRefs.current.get(selected)?.focus() }),
    [selected],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Collapsed tabs are skipped, as if they were not there.
    const available = tabs.filter((tab) => !tab.collapsed);
    const current = available.findIndex((tab) => tab.id === selected);
    const last = available.length - 1;
    const targets: Partial<Record<string, number>> = {
      ArrowRight: current === last ? 0 : current + 1,
      ArrowLeft: current <= 0 ? last : current - 1,
      Home: 0,
      End: last,
    };
    const next = targets[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const { id } = available[next];
    select(id);
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
              onSelect={select}
              buttonRef={(node) => {
                if (node) tabRefs.current.set(tab.id, node);
                else tabRefs.current.delete(tab.id);
              }}
            />
          ))}
        </div>
        {aside && <div className="pb-3">{aside}</div>}
      </div>

      {/* The corner under the first tab stays square so the tab flows into the frame. */}
      {/* Clipped: the inactive panels lie (invisible) on top of the active one and may be taller. */}
      <div
        ref={frameRef}
        className={`relative overflow-clip rounded-control border border-line ${selectedIndex === 0 ? "rounded-tl-none" : ""}`}
      >
        {tabs.map((tab) => {
          const isSelected = tab.id === selected;
          const isOutgoing = tab.id === outgoing;
          return (
            <div
              key={tab.id}
              ref={(node) => {
                if (node) panelRefs.current.set(tab.id, node);
                else panelRefs.current.delete(tab.id);
              }}
              role="tabpanel"
              id={panelId(tab.id)}
              aria-labelledby={tabId(tab.id)}
              aria-hidden={isSelected ? undefined : true}
              inert={!isSelected}
              // Inline style (not a class) so the visibility also applies where no CSS is loaded (tests).
              style={isSelected || isOutgoing ? undefined : { visibility: "hidden" }}
              className={`px-4 sm:px-5 ${isSelected ? "" : "absolute inset-x-0 top-0"}`}
            >
              {tab.panel}
            </div>
          );
        })}
      </div>
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
  /** Increments on every change: used as a React key to restart the signal. */
  key: number;
  direction: "up" | "down";
}

function TabButton<T extends string>({ tab, id, panelId, isSelected, onSelect, buttonRef }: TabButtonProps<T>) {
  const { count, signalChanges = false, collapsed = false } = tab;
  // Natural width of the tab, kept up to date (language, counter): its wrapper animates to it.
  const ownRef = useRef<HTMLButtonElement>(null);
  const [width, setWidth] = useState<number | null>(null);
  useLayoutEffect(() => {
    const node = ownRef.current;
    if (!node) return;
    // Fractional widths (not offsetWidth, which rounds): the tab is aligned to the wrapper's end,
    // so a wrapper even a fraction narrower pushes it left of the frame's edge.
    const measure = () => setWidth(node.getBoundingClientRect().width);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
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

  const stateClasses = isSelected
    ? "z-10 border-line bg-sheet text-ink"
    : collapsed
      ? // Shifted back by its own width: only its right edge shows, an outlined sliver, like a
        // sheet filed behind the previous tab.
        "translate-x-[calc(-100%+2px)] border-line bg-paper text-ink-faint"
      : "border-transparent text-ink-faint hover:bg-brand-soft/60 hover:text-ink";

  return (
    // Opens and closes its width (0 <-> the tab's measured width) while the tab slides back by its
    // own width in step, so a collapsed tab slides out from behind the previous one. The tab stays
    // aligned to the start: its left edge never moves (it lines up with the frame) and a change of
    // width (e.g. another language) only moves its right edge. Clipped horizontally only, to its
    // padding box: the padding leaves room for the focus ring and the net-zero margins keep the
    // spacing. The left padding reaches behind the previous tab's rounded corner, so a collapsed
    // tab's top edge runs on until it meets that tab's border. Vertically it overflows freely
    // (the tab overlaps the frame's top border).
    <div
      aria-hidden={collapsed || undefined}
      inert={collapsed}
      style={{ width: collapsed ? 0 : (width ?? undefined) }}
      className="-mr-1 -ml-3 box-content flex shrink-0 overflow-x-clip pr-1 pl-3 transition-[width] duration-(--motion-view) ease-in-out-soft"
    >
      <button
        ref={(node) => {
          ownRef.current = node;
          buttonRef(node);
        }}
        type="button"
        role="tab"
        id={id}
        aria-selected={isSelected}
        aria-controls={panelId}
        tabIndex={isSelected ? 0 : -1}
        onClick={() => {
          if (!collapsed) onSelect(tab.id);
        }}
        // -mb-px: the selected tab covers the frame's top border, opening the folder into its panel.
        className={`group focus-ring relative -mb-px flex h-10 cursor-pointer shrink-0 items-center rounded-t-control border border-b-0 px-3 font-mono text-[11px] font-medium tracking-[0.14em] whitespace-nowrap uppercase tabular-nums sm:px-4 ${TAB_TRANSITION} ${stateClasses}`}
      >
        {change && (
          <span
            key={change.key}
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 rounded-t-control ${
              change.direction === "up"
                ? "animate-[signal-add_var(--motion-signal)_var(--ease-in-out-soft)]"
                : "animate-[signal-remove_var(--motion-signal)_var(--ease-in-out-soft)]"
            }`}
          />
        )}
        <span
          aria-hidden="true"
          // On hover over an unselected tab it shows faintly and half-grown: a preview of the selection.
          // It fades as it grows (and shrinks): a saturated line is noticed long before the pale
          // background, so this keeps both in step. Tailwind's scale-* sets `scale`, not `transform`.
          className={`absolute inset-x-3 -top-px h-0.5 rounded-full bg-brand transition-[scale,opacity] duration-(--motion-gentle) ease-in-out-soft ${
            isSelected ? "scale-x-100" : "scale-x-0 opacity-0 group-hover:scale-x-50 group-hover:opacity-40"
          }`}
        />
        <span className="relative flex items-center gap-2">
          {tab.icon}
          {tab.label}
          {count === undefined ? (
            // Reserves the counter's width while loading, so the tabs do not shift when it arrives.
            <span aria-hidden="true" className="opacity-0">
              ·&nbsp;00
            </span>
          ) : (
            // The space is ignored by the flex layout (gap spaces it) but keeps the accessible name readable.
            <span className="flex overflow-hidden motion-safe:animate-[fade-in_var(--motion-base)_var(--ease-out-soft)]">
              {" "}·&nbsp;
              <RollingNumber value={count} format={formatCount} />
            </span>
          )}
        </span>
      </button>
    </div>
  );
}

export default Tabs;
