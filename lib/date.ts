import moment from "moment";

/**
 * Convert a value to ISO date string using moment. Use for all API-facing dates.
 */
export function toIsoString(
  v: Date | string | number | moment.Moment | null | undefined
): string | null {
  if (v == null) return null;
  const m = moment(v);
  return m.isValid() ? m.toISOString() : null;
}

/** Current time as ISO string (for optimistic createdAt/updatedAt). */
export function nowIso(): string {
  return moment().toISOString();
}
