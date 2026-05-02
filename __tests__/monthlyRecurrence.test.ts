import { isRecurringTaskDue } from "../src/features/recurrence/recurrenceEngine";
import type { Task } from "../src/lib/types";

function monthlyTask(anchorDate: string): Task {
  return {
    id: "monthly",
    externalId: null,
    folderId: "general",
    title: "Monthly review",
    description: "",
    scheduledDate: anchorDate,
    durationHours: 2,
    defaultedDuration: false,
    energyType: "light",
    sequenceIndex: null,
    sequenceGroupId: null,
    status: "todo",
    recurrenceType: "monthly",
    recurrenceDaysOfWeek: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

test("monthly recurrence is due on the same day of month", () => {
  const task = monthlyTask("2026-05-07");
  expect(isRecurringTaskDue(task, "2026-06-07", [])).toBe(true);
  expect(isRecurringTaskDue(task, "2026-06-08", [])).toBe(false);
});

test("monthly recurrence uses last day when month lacks anchor day", () => {
  const task = monthlyTask("2026-01-31");
  expect(isRecurringTaskDue(task, "2026-02-28", [])).toBe(true);
  expect(isRecurringTaskDue(task, "2026-04-30", [])).toBe(true);
  expect(isRecurringTaskDue(task, "2026-03-31", [])).toBe(true);
});

test("monthly recurrence handles leap year February", () => {
  const task = monthlyTask("2028-01-31");
  expect(isRecurringTaskDue(task, "2028-02-29", [])).toBe(true);
});
