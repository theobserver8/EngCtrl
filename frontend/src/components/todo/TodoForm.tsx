import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useI18n } from "../../i18n/useI18n";
import { TODO_LIMITS, type TodoDraft } from "../../types/todo";
import Button from "../ui/Button";
import { CloseIcon, PlusIcon } from "../ui/icons";

interface TodoFormProps {
  onSubmit: (draft: TodoDraft) => Promise<boolean>;
  isSubmitting?: boolean;
}

// Shared "writing on a form line" look for both fields.
const FIELD_CLASSES =
  "w-full border-b border-line-strong bg-transparent text-ink transition-[border-color,box-shadow] placeholder:text-ink-faint focus:border-brand focus:shadow-[0_1px_0_0_var(--color-brand)] focus:outline-none";

function TodoForm({ onSubmit, isSubmitting = false }: TodoFormProps) {
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [showDescription, setShowDescription] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const addDescriptionRef = useRef<HTMLButtonElement>(null);
  const canSubmit = title.trim().length > 0 && !isSubmitting;

  // Move the focus only when the user opens or closes the description (not on submit or first
  // render): into the field when it opens, back to "Add description" when it is removed.
  const moveFocusNext = useRef(false);
  useEffect(() => {
    if (moveFocusNext.current)
      (showDescription ? descriptionRef : addDescriptionRef).current?.focus();
    moveFocusNext.current = false;
  }, [showDescription]);

  const openDescription = () => {
    // Cleared when opening (not when closing) so the text does not vanish mid-collapse.
    setDescription("");
    moveFocusNext.current = true;
    setShowDescription(true);
  };

  const removeDescription = () => {
    moveFocusNext.current = true;
    setShowDescription(false);
  };

  const submit = async () => {
    if (!canSubmit) return;
    if (
      await onSubmit({ title, description: showDescription ? description : "" })
    ) {
      setTitle("");
      setShowDescription(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit();
  };

  // Enter adds a new line in the description; Ctrl/Cmd + Enter submits the form.
  const handleDescriptionKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      void submit();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-end gap-3">
        <div className="min-w-0 flex-1">
          <label htmlFor={titleId} className="label-mono">
            {t.form.label}
          </label>
          <input
            id={titleId}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.form.placeholder}
            maxLength={TODO_LIMITS.titleMaxLength}
            autoComplete="off"
            className={`mt-1 h-10 text-[15px] ${FIELD_CLASSES}`}
          />
        </div>
        <Button type="submit" disabled={!canSubmit} icon={<PlusIcon />}>
          {t.form.submit}
        </Button>
      </div>

      {/* The "Add description" link and the description panel swap smoothly: both stay mounted
          (`inert` while hidden) and open or close their height (grid rows 0fr <-> 1fr).
          Opening: the link folds away while the panel opens, then the content fades in.
          Closing: the content fades out first, then the panel folds and the link comes back.
          The delays only apply on the way into each state. */}
      <div
        inert={showDescription}
        className={`grid transition-[grid-template-rows,opacity] ease-in-out-soft ${
          showDescription
            ? "grid-rows-[0fr] opacity-0 duration-(--motion-slow)"
            : "grid-rows-[1fr] opacity-100 delay-200 duration-(--motion-gentle)"
        }`}
      >
        {/* Only the vertical axis is clipped; the padding leaves room for the focus ring. */}
        <div className="min-h-0 overflow-y-clip">
          <div className="pt-3 pb-1">
            <button
              ref={addDescriptionRef}
              type="button"
              onClick={openDescription}
              className="focus-ring -ml-1 inline-flex cursor-pointer items-center gap-1.5 rounded-[6px] px-1 py-0.5 text-[13px] text-ink-soft transition-colors hover:text-brand"
            >
              <PlusIcon className="size-3.5" />
              {t.form.descriptionAdd}
            </button>
          </div>
        </div>
      </div>

      <div
        inert={!showDescription}
        className={`grid transition-[grid-template-rows] duration-(--motion-gentle) ease-in-out-soft ${
          showDescription ? "grid-rows-[1fr]" : "grid-rows-[0fr] delay-150"
        }`}
      >
        <div className="min-h-0 overflow-y-clip">
          {/* Tailwind's translate-* sets the `translate` property (not `transform`). */}
          <div
            className={`pt-5 transition-[opacity,translate] ease-out-soft ${
              showDescription
                ? "translate-y-0 opacity-100 delay-300 duration-(--motion-gentle)"
                : "-translate-y-1.5 opacity-0 duration-(--motion-base)"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <label htmlFor={descriptionId} className="label-mono">
                {t.form.descriptionLabel}
              </label>
              <div className="flex items-center gap-1">
                <span className="font-mono text-[10px] text-ink-faint tabular-nums">
                  {description.length}/{TODO_LIMITS.descriptionMaxLength}
                </span>
                <button
                  type="button"
                  onClick={removeDescription}
                  aria-label={t.form.descriptionRemove}
                  title={t.form.descriptionRemove}
                  className="focus-ring grid size-7 cursor-pointer place-items-center rounded-[6px] text-ink-faint transition-colors hover:bg-paper hover:text-ink"
                >
                  <CloseIcon className="size-3.5" />
                </button>
              </div>
            </div>
            <textarea
              ref={descriptionRef}
              id={descriptionId}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleDescriptionKeyDown}
              placeholder={t.form.descriptionPlaceholder}
              maxLength={TODO_LIMITS.descriptionMaxLength}
              rows={2}
              className={`mt-1 block max-h-40 min-h-16 resize-none py-2 text-sm leading-relaxed field-sizing-content ${FIELD_CLASSES}`}
            />
            <p className="mt-1.5 font-mono text-[10px] tracking-[0.08em] text-ink-faint">
              {t.form.submitHint}
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}

export default TodoForm;
