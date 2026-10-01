import type { InputHTMLAttributes } from "react";
import { CheckIcon } from "./icons";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

/** Native checkbox (keeps keyboard and screen reader behaviour) with the CEMOSA look. */
function Checkbox({ className = "", ...props }: CheckboxProps) {
  return (
    <span className={`relative inline-grid size-5 shrink-0 place-items-center ${className}`}>
      <input
        type="checkbox"
        className="peer focus-ring size-5 cursor-pointer appearance-none rounded-[5px] border-[1.5px] border-ink-faint/70 bg-sheet transition-colors duration-150 checked:border-brand checked:bg-brand hover:border-brand disabled:cursor-not-allowed"
        {...props}
      />
      <CheckIcon className="pointer-events-none absolute size-3.5 text-white opacity-0 transition-opacity duration-150 peer-checked:opacity-100" />
    </span>
  );
}

export default Checkbox;
