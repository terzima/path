import { weekdayNumber } from "../../lib/dates";
import type { RecurringCompletion, Task } from "../../lib/types";

export function isRecurringTaskDue(
  task: Task,
  dateKey: string,
  completions: RecurringCompletion[],
): boolean {
  if (!task.recurrenceType) return false;
  if (dateKey < task.scheduledDate) return false;
  if (isRecurringTaskComplete(task, dateKey, completions)) return false;

  if (task.recurrenceType === "daily") return true;
  if (task.recurrenceType === "weekly") {
    return weekdayNumber(task.scheduledDate) === weekdayNumber(dateKey);
  }
  return task.recurrenceDaysOfWeek.includes(weekdayNumber(dateKey));
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
