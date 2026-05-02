import { getCurrentOccurrenceDate, isRecurringTaskOverdue } from "../src/features/recurrence/recurrenceEngine";
import type { RecurringCompletion, Task } from "../src/lib/types";

function recurringTask(recurrenceType: Task["recurrenceType"], scheduledDate: string, days: number[] = []): Task {
  return {
    id: `${recurrenceType}-${scheduledDate}`,
    externalId: null,
    folderId: "general",
    title: "Recurring",
    description: "",
    scheduledDate,
    durationHours: 2,
    defaultedDuration: false,
    energyType: "light",
    sequenceIndex: null,
    sequenceGroupId: null,
    status: "todo",
    recurrenceType,
    recurrenceDaysOfWeek: days,
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z",
  };
}

const completions: RecurringCompletion[] = [];

test("daily missed recurrence does not remain overdue the next day", () => {
  const task = recurringTask("daily", "2026-05-03");
  expect(isRecurringTaskOverdue(task, "2026-05-04", completions)).toBe(false);
  expect(getCurrentOccurrenceDate(task, "2026-05-04")).toBe("2026-05-04");
});

test("weekly missed recurrence stays overdue until next weekly occurrence", () => {
  const task = recurringTask("weekly", "2026-05-04");
  expect(isRecurringTaskOverdue(task, "2026-05-06", completions)).toBe(true);
  expect(isRecurringTaskOverdue(task, "2026-05-11", completions)).toBe(false);
  expect(getCurrentOccurrenceDate(task, "2026-05-11")).toBe("2026-05-11");
});

test("specific day missed recurrence expires at next selected weekday", () => {
  const task = recurringTask("specific_days", "2026-05-04", [1, 3]);
  expect(isRecurringTaskOverdue(task, "2026-05-05", completions)).toBe(true);
  expect(isRecurringTaskOverdue(task, "2026-05-06", completions)).toBe(false);
});

test("monthly missed recurrence stays overdue until next monthly occurrence", () => {
  const task = recurringTask("monthly", "2026-01-31");
  expect(isRecurringTaskOverdue(task, "2026-02-15", completions)).toBe(true);
  expect(isRecurringTaskOverdue(task, "2026-02-28", completions)).toBe(false);
});
