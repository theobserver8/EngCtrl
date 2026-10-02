import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
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
  "w-full border-b border-line-strong bg-transparent text-ink transition-[border-color,box-shadow] duration-150 placeholder:text-ink-faint focus:border-brand focus:shadow-[0_1px_0_0_var(--color-brand)] focus:outline-none";

function TodoForm({ onSubmit, isSubmitting = false }: TodoFormProps) {
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [showDescription, setShowDescription] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const canSubmit = title.trim().length > 0 && !isSubmitting;

  // Focus the description only when the user opens it (not on reset or first render).
  const focusDescriptionNext = useRef(false);
  useEffect(() => {
    if (showDescription && focusDescriptionNext.current) descriptionRef.current?.focus();
    focusDescriptionNext.current = false;
  }, [showDescription]);

  const openDescription = () => {
    focusDescriptionNext.current = true;
    setShowDescription(true);
  };

  const closeDescription = () => {
    setDescription("");
    setShowDescription(false);
  };

  const submit = async () => {
    if (!canSubmit) return;
    if (await onSubmit({ title, description: showDescription ? description : "" })) {
      setTitle("");
      closeDescription();
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit();
  };

  // Enter adds a new line in the description; Ctrl/Cmd + Enter submits the form.
  const handleDescriptionKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
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

      {showDescription ? (
        <div className="mt-5">
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
                onClick={closeDescription}
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
      ) : (
        <button
          type="button"
          onClick={openDescription}
          className="focus-ring mt-3 -ml-1 inline-flex cursor-pointer items-center gap-1.5 rounded-[6px] px-1 py-0.5 text-[13px] text-ink-soft transition-colors hover:text-brand"
        >
          <PlusIcon className="size-3.5" />
          {t.form.descriptionAdd}
        </button>
      )}
    </form>
  );
}

export default TodoForm;
