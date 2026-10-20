// Calendar-date helpers. All dates are "YYYY-MM-DD" strings so month math never
// depends on the server's time zone. "Today" is always resolved in America/Chicago.

export type ISODate = string;

export const BUSINESS_TZ = "America/Chicago";

const chicagoFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: BUSINESS_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** The calendar date in America/Chicago at the given instant. */
export function todayInChicago(now: Date = new Date()): ISODate {
  return chicagoFormatter.format(now);
}

function parse(date: ISODate): Date {
  return new Date(`${date}T00:00:00Z`);
}

function format(d: Date): ISODate {
  return d.toISOString().slice(0, 10);
}

export function addDays(date: ISODate, days: number): ISODate {
  const d = parse(date);
  d.setUTCDate(d.getUTCDate() + days);
  return format(d);
}

/** The 1st of the month containing `date`. */
export function monthStart(date: ISODate): ISODate {
  return `${date.slice(0, 7)}-01`;
}

/** The last day of the month containing `date`. */
export function monthEnd(date: ISODate): ISODate {
  const d = parse(monthStart(date));
  d.setUTCMonth(d.getUTCMonth() + 1, 0);
  return format(d);
}

export function addMonths(month: ISODate, months: number): ISODate {
  const d = parse(monthStart(month));
  d.setUTCMonth(d.getUTCMonth() + months);
  return format(d);
}

export function isInMonth(date: ISODate, month: ISODate): boolean {
  return date.slice(0, 7) === month.slice(0, 7);
}

export function isWeekend(date: ISODate): boolean {
  const dow = parse(date).getUTCDay();
  return dow === 0 || dow === 6;
}

export function isBusinessDay(date: ISODate, holidays: ReadonlySet<ISODate> = new Set()): boolean {
  return !isWeekend(date) && !holidays.has(date);
}

/** Business days (Mon–Fri minus holidays) in the month containing `month`. */
export function businessDaysInMonth(
  month: ISODate,
  holidays: ReadonlySet<ISODate> = new Set(),
): number {
  let count = 0;
  const end = monthEnd(month);
  for (let d = monthStart(month); d <= end; d = addDays(d, 1)) {
    if (isBusinessDay(d, holidays)) count++;
  }
  return count;
}

/**
 * Business days of `month` that have elapsed as of `asOf`.
 * By default counts through the previous business day, because today's time is
 * usually not logged yet (setting `pace.includeToday`).
 */
export function businessDaysElapsed(
  month: ISODate,
  asOf: ISODate,
  holidays: ReadonlySet<ISODate> = new Set(),
  includeToday = false,
): number {
  const start = monthStart(month);
  const end = monthEnd(month);
  const last = includeToday ? asOf : addDays(asOf, -1);
  const stop = last < end ? last : end;
  let count = 0;
  for (let d = start; d <= stop; d = addDays(d, 1)) {
    if (isBusinessDay(d, holidays)) count++;
  }
  return count;
}

/** `date` itself if it's a business day, otherwise the next one. */
export function onOrNextBusinessDay(
  date: ISODate,
  holidays: ReadonlySet<ISODate> = new Set(),
): ISODate {
  let d = date;
  while (!isBusinessDay(d, holidays)) d = addDays(d, 1);
  return d;
}

/** The first business day of the month containing `month`. */
export function firstBusinessDay(
  month: ISODate,
  holidays: ReadonlySet<ISODate> = new Set(),
): ISODate {
  return onOrNextBusinessDay(monthStart(month), holidays);
}
