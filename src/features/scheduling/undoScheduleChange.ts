import type { ScheduleChange, Task } from "../../lib/types";

export function undoScheduleChange(tasks: Task[], change: ScheduleChange): Task[] {
  return tasks.map((task) => {
    const previousDate = change.previousDates[task.id];
    if (!previousDate) return task;
    return { ...task, scheduledDate: previousDate, updatedAt: new Date().toISOString() };
  });
}
