import { addDays, fromDateKey, monthlyOccurrenceDay, weekdayNumber } from "../../lib/dates";
import type { RecurringCompletion, Task } from "../../lib/types";

export function isRecurringTaskDue(
  task: Task,
  dateKey: string,
  completions: RecurringCompletion[],
): boolean {
  if (!task.recurrenceType) return false;
  if (!isOccurrenceDate(task, dateKey)) return false;
  return !isRecurringTaskComplete(task, dateKey, completions);
}

export function isRecurringTaskComplete(
  task: Task,
  dateKey: string,
  completions: RecurringCompletion[],
): boolean {
  return completions.some(
    (completion) => completion.recurringTaskId === task.id && completion.completionDate === dateKey,
  );
}

export function isOccurrenceDate(task: Task, dateKey: string): boolean {
  if (!task.recurrenceType || dateKey < task.scheduledDate) return false;
  if (task.recurrenceType === "daily") return true;
  if (task.recurrenceType === "weekly") {
    return weekdayNumber(task.scheduledDate) === weekdayNumber(dateKey);
  }
  if (task.recurrenceType === "specific_days") {
    return task.recurrenceDaysOfWeek.includes(weekdayNumber(dateKey));
  }
  const date = fromDateKey(dateKey);
  return date.getDate() === monthlyOccurrenceDay(task.scheduledDate, dateKey);
}

export function getCurrentOccurrenceDate(task: Task, dateKey: string): string | null {
  if (!task.recurrenceType || dateKey < task.scheduledDate) return null;
  if (task.recurrenceType === "daily") return dateKey;

  let cursor = task.scheduledDate;
  let latest: string | null = null;
  while (cursor <= dateKey) {
    if (isOccurrenceDate(task, cursor)) latest = cursor;
    cursor = addDays(cursor, 1);
  }
  return latest;
}

export function isRecurringTaskOverdue(
  task: Task,
  dateKey: string,
  completions: RecurringCompletion[],
): boolean {
  const currentOccurrence = getCurrentOccurrenceDate(task, dateKey);
  if (!currentOccurrence || currentOccurrence === dateKey) return false;
  return !isRecurringTaskComplete(task, currentOccurrence, completions);
}
