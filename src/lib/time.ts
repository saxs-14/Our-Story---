/** Date & duration math for the live relationship counters and date-driven content. */

export interface Duration {
  years: number;
  months: number;
  weeks: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** Total elapsed, useful for stats */
  totalDays: number;
  totalHours: number;
  totalSeconds: number;
}

const DAY_MS = 86_400_000;

export function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value + 'T00:00:00');
}

/** Calendar-accurate elapsed time broken into Y / M / W / D / h / m / s. */
export function elapsedSince(fromISO: string | Date, now: Date = new Date()): Duration {
  const from = toDate(fromISO);
  const totalSeconds = Math.max(0, Math.floor((now.getTime() - from.getTime()) / 1000));
  const totalDays = Math.floor(totalSeconds / 86_400);
  const totalHours = Math.floor(totalSeconds / 3600);

  // Calendar-accurate years & months (accounts for varying month lengths).
  let years = now.getFullYear() - from.getFullYear();
  let months = now.getMonth() - from.getMonth();
  let dayDiff = now.getDate() - from.getDate();

  if (dayDiff < 0) {
    months -= 1;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    dayDiff += prevMonth;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const weeks = Math.floor(dayDiff / 7);
  const days = dayDiff % 7;

  const hours = now.getHours() - from.getHours();
  const h = ((hours % 24) + 24) % 24;
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  return {
    years: Math.max(0, years),
    months: Math.max(0, months),
    weeks,
    days,
    hours: h,
    minutes,
    seconds,
    totalDays,
    totalHours,
    totalSeconds,
  };
}

export function daysBetween(a: string | Date, b: string | Date = new Date()): number {
  return Math.floor((toDate(b).getTime() - toDate(a).getTime()) / DAY_MS);
}

/** 1–366 — the index used to pick a deterministic "message of the day". */
export function dayOfYear(date: Date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / DAY_MS);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** True when today is the monthly or yearly anniversary of `iso`. */
export function isAnniversaryToday(iso: string, now: Date = new Date()): boolean {
  const d = toDate(iso);
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && now > d;
}

export function isMonthiversaryToday(iso: string, now: Date = new Date()): boolean {
  const d = toDate(iso);
  return d.getDate() === now.getDate() && now > d;
}

export function isBirthdayToday(iso: string, now: Date = new Date()): boolean {
  const d = toDate(iso);
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
}

/** Next occurrence of a month/day anniversary, returning the date + days away. */
export function nextYearlyOccurrence(iso: string, now: Date = new Date()) {
  const d = toDate(iso);
  let next = new Date(now.getFullYear(), d.getMonth(), d.getDate());
  if (next.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) {
    next = new Date(now.getFullYear() + 1, d.getMonth(), d.getDate());
  }
  return { date: next, daysAway: daysBetween(now, next) };
}

export function formatLongDate(value: string | Date): string {
  return toDate(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatMonthYear(value: string | Date): string {
  return toDate(value).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

/** Pad to 2 digits for clocks/counters. */
export function pad(n: number): string {
  return n.toString().padStart(2, '0');
}
