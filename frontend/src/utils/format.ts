/** Inspection-style reference code for a todo, e.g. 7 -> "T-007". */
export function formatReference(id: number): string {
  return `T-${String(id).padStart(3, "0")}`;
}

/** Zero-padded counter used in labels and the title block, e.g. 7 -> "07". */
export function formatCount(value: number): string {
  return String(value).padStart(2, "0");
}
