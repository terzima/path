export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(dateKey: string, days: number): string {
  const date = fromDateKey(dateKey);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

export function todayKey(now = new Date()): string {
  return toDateKey(now);
}

export function weekdayNumber(dateKey: string): number {
  const jsDay = fromDateKey(dateKey).getDay();
  return jsDay === 0 ? 7 : jsDay;
}

export function lastDayOfMonth(year: number, monthIndexZeroBased: number): number {
  return new Date(year, monthIndexZeroBased + 1, 0).getDate();
}

export function monthlyOccurrenceDay(anchorDateKey: string, targetDateKey: string): number {
  const anchor = fromDateKey(anchorDateKey);
  const target = fromDateKey(targetDateKey);
  return Math.min(anchor.getDate(), lastDayOfMonth(target.getFullYear(), target.getMonth()));
}

export function monthKey(dateKey: string): string {
  return dateKey.slice(0, 7);
}

export function monthLabel(monthKeyValue: string): string {
  const [year, month] = monthKeyValue.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export function formatShortDate(dateKey: string): string {
  return fromDateKey(dateKey).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
