import { addDays } from "../../lib/dates";
import type { ScheduleChange, ScheduleChangeReason, Task } from "../../lib/types";

export type CascadeShiftResult = {
  tasks: Task[];
  change: Omit<ScheduleChange, "id" | "changedAt">;
};

export function shiftTasks(input: {
  tasks: Task[];
  selectedTaskIds: string[];
  dayDelta: number;
  cascade: boolean;
}): CascadeShiftResult {
  const selectedIds = new Set(input.selectedTaskIds);
  const selected = input.tasks.filter((task) => selectedIds.has(task.id));
  const maxSelectedSequence = Math.max(...selected.map((task) => task.sequenceIndex ?? -1));
  const folderIds = new Set(selected.map((task) => task.folderId));
  const groups = new Set(selected.map((task) => task.sequenceGroupId));
  const previousDates: Record<string, string> = {};
  const newDates: Record<string, string> = {};

  const shouldMove = (task: Task) => {
    if (selectedIds.has(task.id)) return true;
    if (!input.cascade) return false;
    if (task.recurrenceType) return false;
    if (!folderIds.has(task.folderId)) return false;
    if (!groups.has(task.sequenceGroupId)) return false;
    return (task.sequenceIndex ?? -1) > maxSelectedSequence;
  };

  const tasks = input.tasks.map((task) => {
    if (!shouldMove(task)) return task;
    const shifted = addDays(task.scheduledDate, input.dayDelta);
    previousDates[task.id] = task.scheduledDate;
    newDates[task.id] = shifted;
    return { ...task, scheduledDate: shifted, updatedAt: new Date().toISOString() };
  });

  const reason: ScheduleChangeReason = input.cascade ? "cascade-shift" : "manual-reschedule";
  return { tasks, change: { taskIds: Object.keys(newDates), previousDates, newDates, reason } };
}
