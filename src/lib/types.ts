export type EnergyType = "deep" | "light" | "admin";
export type TaskStatus = "todo" | "done" | "skipped";
export type RecurrenceType = "daily" | "weekly" | "specific_days" | "monthly";
export type ScheduleChangeReason = "manual-reschedule" | "cascade-shift";

export type Folder = {
  id: string;
  name: string;
  colorHex: string;
  createdAt: string;
};

export type ChecklistItem = {
  id: string;
  taskId: string;
  text: string;
  done: boolean;
  sortOrder: number;
};

export type Task = {
  id: string;
  folderId: string | null;
  title: string;
  description: string;
  scheduledDate: string;
  durationHours: number;
  defaultedDuration: boolean;
  energyType: EnergyType;
  sequenceIndex: number | null;
  sequenceGroupId: string | null;
  status: TaskStatus;
  recurrenceType: RecurrenceType | null;
  recurrenceDaysOfWeek: number[];
  createdAt: string;
  updatedAt: string;
};

export type RecurringCompletion = {
  id: string;
  recurringTaskId: string;
  completionDate: string;
  completedAt: string;
};

export type ScheduleChange = {
  id: string;
  changedAt: string;
  taskIds: string[];
  previousDates: Record<string, string>;
  newDates: Record<string, string>;
  reason: ScheduleChangeReason;
};
