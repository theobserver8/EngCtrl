import { useI18n } from "../../i18n/useI18n";
import { StarIcon } from "../ui/icons";

interface FavoriteToggleProps {
  title: string;
  favorite: boolean;
  onToggle: () => void;
}

function FavoriteToggle({ title, favorite, onToggle }: FavoriteToggleProps) {
  const { t } = useI18n();
  const label = favorite ? t.tasks.unfavorite(title) : t.tasks.favorite(title);

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={favorite}
      aria-label={label}
      title={label}
      className={`focus-ring grid size-8 shrink-0 cursor-pointer place-items-center rounded-[6px] transition-[background-color,color,opacity] duration-(--motion-base) hover:bg-lime-soft pointer-coarse:size-10 ${
        favorite
          ? "text-ink"
          : // Same reveal rules as the delete button (hover or keyboard focus in the row).
            "text-ink-faint opacity-0 group-hover:opacity-100 group-has-focus-visible:opacity-100 hover:text-ink pointer-coarse:opacity-100"
      }`}
    >
      <StarIcon
        className={`size-4 transition-[fill,scale] duration-(--motion-base) ${favorite ? "scale-110 fill-lime" : "fill-transparent"}`}
      />
    </button>
  );
}

export default FavoriteToggle;
