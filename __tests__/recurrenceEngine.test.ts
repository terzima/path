import { isRecurringTaskDue } from "../src/features/recurrence/recurrenceEngine";
import type { Task } from "../src/lib/types";

const baseTask: Task = {
  id: "prayer",
  folderId: null,
  title: "Prayer",
  description: "",
  scheduledDate: "2026-05-04",
  durationHours: 2,
  defaultedDuration: false,
  energyType: "light",
  sequenceIndex: null,
  sequenceGroupId: null,
  status: "todo",
  recurrenceType: "daily",
  recurrenceDaysOfWeek: [],
  createdAt: "2026-05-04T00:00:00.000Z",
  updatedAt: "2026-05-04T00:00:00.000Z",
};

test("daily recurring task is due unless completed for that date", () => {
  expect(isRecurringTaskDue(baseTask, "2026-05-05", [])).toBe(true);
  expect(
    isRecurringTaskDue(baseTask, "2026-05-05", [
      {
        id: "done",
        recurringTaskId: "prayer",
        completionDate: "2026-05-05",
        completedAt: "2026-05-05T10:00:00.000Z",
      },
    ]),
  ).toBe(false);
});

test("specific day recurrence only appears on selected weekdays", () => {
  const task = { ...baseTask, recurrenceType: "specific_days" as const, recurrenceDaysOfWeek: [1, 3] };
  expect(isRecurringTaskDue(task, "2026-05-06", [])).toBe(true);
  expect(isRecurringTaskDue(task, "2026-05-07", [])).toBe(false);
});
