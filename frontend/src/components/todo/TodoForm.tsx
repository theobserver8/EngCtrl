import { useId, useState, type FormEvent } from "react";
import { useI18n } from "../../i18n/useI18n";
import Button from "../ui/Button";
import { PlusIcon } from "../ui/icons";

export const TITLE_MAX_LENGTH = 120;

interface TodoFormProps {
  onSubmit: (title: string) => Promise<boolean>;
  isSubmitting?: boolean;
}

function TodoForm({ onSubmit, isSubmitting = false }: TodoFormProps) {
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const inputId = useId();
  const canSubmit = title.trim().length > 0 && !isSubmitting;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    if (await onSubmit(title)) setTitle("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex min-w-0 flex-[1_1_20rem] items-end gap-3">
      <div className="min-w-0 flex-1">
        <label htmlFor={inputId} className="label-mono">
          {t.form.label}
        </label>
        <input
          id={inputId}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t.form.placeholder}
          maxLength={TITLE_MAX_LENGTH}
          autoComplete="off"
          className="mt-1 h-10 w-full border-b border-line-strong bg-transparent text-[15px] text-ink transition-[border-color,box-shadow] duration-150 placeholder:text-ink-faint focus:border-brand focus:shadow-[0_1px_0_0_var(--color-brand)] focus:outline-none"
        />
      </div>
      <Button type="submit" disabled={!canSubmit} icon={<PlusIcon />}>
        {t.form.submit}
      </Button>
    </form>
  );
}

export default TodoForm;
