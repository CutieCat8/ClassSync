// Local calendar date helpers for the schedule domain.
//
// All course/meeting dates are plain "YYYY-MM-DD" calendar dates in the
// Asia/Bangkok timezone. We never parse them with `new Date(dateStr)`
// (which reads the string as UTC and can shift the date depending on the
// runtime's local timezone). Instead we always build Date objects from
// explicit year/month/day components using the local constructor, and we
// use plain string comparison for ordering, since zero-padded
// "YYYY-MM-DD" strings sort identically to their chronological order.

export type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type ScheduleView = "day" | "week" | "month" | "range";

export interface DateInterval {
  start: string; // YYYY-MM-DD inclusive
  end: string; // YYYY-MM-DD inclusive
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateString(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const LONG_WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const LONG_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// "Wednesday, 6 May, 2026" — locale-independent so it never flips to US order.
export function formatLongDate(dateStr: string): string {
  const date = parseLocalDate(dateStr);
  return `${LONG_WEEKDAYS[date.getDay()]}, ${date.getDate()} ${LONG_MONTHS[date.getMonth()]}, ${date.getFullYear()}`;
}

export function getWeekdayOfDate(dateStr: string): WeekdayIndex {
  return parseLocalDate(dateStr).getDay() as WeekdayIndex;
}

export function addDays(dateStr: string, amount: number): string {
  const date = parseLocalDate(dateStr);
  date.setDate(date.getDate() + amount);
  return formatLocalDate(date);
}

export function compareDates(a: string, b: string): -1 | 0 | 1 {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export function isDateInRange(dateStr: string, start: string, end: string): boolean {
  return dateStr >= start && dateStr <= end;
}

export function todayLocal(): string {
  return formatLocalDate(new Date());
}

export function getStartOfWeek(dateStr: string): string {
  // Week starts Monday.
  const weekday = getWeekdayOfDate(dateStr);
  const offsetFromMonday = weekday === 0 ? 6 : weekday - 1;
  return addDays(dateStr, -offsetFromMonday);
}

export function getEndOfWeek(dateStr: string): string {
  return addDays(getStartOfWeek(dateStr), 6);
}

export function getStartOfMonth(dateStr: string): string {
  const [y, m] = dateStr.split("-");
  return `${y}-${m}-01`;
}

export function getEndOfMonth(dateStr: string): string {
  const [y, m] = dateStr.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

export const MAX_CUSTOM_RANGE_DAYS = 62;

export interface ViewDateIntervalInput {
  view: ScheduleView;
  activeDate: string;
  selectedRange?: { from: string; to: string } | null;
}

export class RangeExceedsMaxError extends Error {
  maxDays: number;
  requestedDays: number;
  constructor(maxDays: number, requestedDays: number) {
    super(`Custom range spans ${requestedDays} days; the maximum allowed is ${maxDays} days.`);
    this.name = "RangeExceedsMaxError";
    this.maxDays = maxDays;
    this.requestedDays = requestedDays;
  }
}

// Computes the visible date interval from the view first, independent of
// whether any events fall inside it (see handoff section 7, "View-range rule").
export function getViewDateInterval({ view, activeDate, selectedRange }: ViewDateIntervalInput): DateInterval {
  if (view === "day") {
    return { start: activeDate, end: activeDate };
  }
  if (view === "week") {
    return { start: getStartOfWeek(activeDate), end: getEndOfWeek(activeDate) };
  }
  if (view === "month") {
    return { start: getStartOfMonth(activeDate), end: getEndOfMonth(activeDate) };
  }
  // view === "range"
  if (!selectedRange || !selectedRange.from) {
    return { start: activeDate, end: activeDate };
  }
  const start = selectedRange.from;
  const end = selectedRange.to || selectedRange.from;
  const [rangeStart, rangeEnd] = compareDates(start, end) <= 0 ? [start, end] : [end, start];
  const spanDays = dateDiffInDays(rangeStart, rangeEnd) + 1;
  if (spanDays > MAX_CUSTOM_RANGE_DAYS) {
    throw new RangeExceedsMaxError(MAX_CUSTOM_RANGE_DAYS, spanDays);
  }
  return { start: rangeStart, end: rangeEnd };
}

export function dateDiffInDays(startDate: string, endDate: string): number {
  const a = parseLocalDate(startDate);
  const b = parseLocalDate(endDate);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((b.getTime() - a.getTime()) / msPerDay);
}

export function eachDateInInterval(interval: DateInterval): string[] {
  const dates: string[] = [];
  let cursor = interval.start;
  while (compareDates(cursor, interval.end) <= 0) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return dates;
}
