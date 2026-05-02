import { createId } from "../id";
import type {
  ChecklistItem,
  EnergyType,
  Folder,
  RecurrenceType,
  RecurringCompletion,
  ScheduleChange,
  Task,
  TaskStatus,
} from "../types";
import { todayKey } from "../dates";
import { getDatabase } from "./database";

export async function createFolder(name: string): Promise<Folder> {
  const folder: Folder = {
    id: createId(),
    name,
    colorHex: "#3B82F6",
    createdAt: new Date().toISOString(),
  };
  const db = await getDatabase();
  await db.runAsync(
    "INSERT INTO folders (id, name, color_hex, created_at) VALUES (?, ?, ?, ?)",
    folder.id,
    folder.name,
    folder.colorHex,
    folder.createdAt,
  );
  return folder;
}

export async function listFolders(): Promise<Folder[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<FolderRow>("SELECT * FROM folders ORDER BY name ASC");
  return rows.map(rowToFolder);
}

export async function getFolder(id: string): Promise<Folder | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<FolderRow>("SELECT * FROM folders WHERE id = ?", id);
  return row ? rowToFolder(row) : null;
}

export async function listTasks(): Promise<Task[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TaskRow>("SELECT * FROM tasks ORDER BY scheduled_date ASC, sequence_index ASC");
  return rows.map(rowToTask);
}

export async function listTasksForFolder(folderId: string): Promise<Task[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TaskRow>(
    "SELECT * FROM tasks WHERE folder_id = ? ORDER BY sequence_index ASC, scheduled_date ASC",
    folderId,
  );
  return rows.map(rowToTask);
}

export async function insertTask(task: Task): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO tasks (
      id, folder_id, title, description, scheduled_date, duration_hours, defaulted_duration,
      energy_type, sequence_index, sequence_group_id, status, recurrence_type,
      recurrence_days_of_week, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    task.id,
    task.folderId,
    task.title,
    task.description,
    task.scheduledDate,
    task.durationHours,
    task.defaultedDuration ? 1 : 0,
    task.energyType,
    task.sequenceIndex,
    task.sequenceGroupId,
    task.status,
    task.recurrenceType,
    JSON.stringify(task.recurrenceDaysOfWeek),
    task.createdAt,
    task.updatedAt,
  );
}

export async function insertTasks(tasks: Task[]): Promise<void> {
  for (const task of tasks) {
    await insertTask(task);
  }
}

export async function updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("UPDATE tasks SET status = ?, updated_at = ? WHERE id = ?", status, new Date().toISOString(), taskId);
}

export async function updateTaskDate(taskId: string, scheduledDate: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE tasks SET scheduled_date = ?, updated_at = ? WHERE id = ?",
    scheduledDate,
    new Date().toISOString(),
    taskId,
  );
}

export async function updateTaskDates(tasks: Task[]): Promise<void> {
  for (const task of tasks) {
    await updateTaskDate(task.id, task.scheduledDate);
  }
}

export async function insertChecklistItems(taskId: string, itemTexts: string[]): Promise<void> {
  const db = await getDatabase();
  for (const [index, text] of itemTexts.entries()) {
    const trimmed = text.trim();
    if (!trimmed) continue;
    await db.runAsync(
      "INSERT INTO checklist_items (id, task_id, text, done, sort_order) VALUES (?, ?, ?, ?, ?)",
      createId(),
      taskId,
      trimmed,
      0,
      index,
    );
  }
}

export async function listChecklistItems(taskId: string): Promise<ChecklistItem[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ChecklistRow>(
    "SELECT * FROM checklist_items WHERE task_id = ? ORDER BY sort_order ASC",
    taskId,
  );
  return rows.map(rowToChecklist);
}

export async function listRecurringCompletions(): Promise<RecurringCompletion[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<RecurringCompletionRow>("SELECT * FROM recurring_completions");
  return rows.map(rowToRecurringCompletion);
}

export async function createRecurringCompletion(taskId: string, completionDate: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR IGNORE INTO recurring_completions (id, recurring_task_id, completion_date, completed_at)
     VALUES (?, ?, ?, ?)`,
    createId(),
    taskId,
    completionDate,
    new Date().toISOString(),
  );
}

export async function deleteRecurringCompletion(taskId: string, completionDate: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "DELETE FROM recurring_completions WHERE recurring_task_id = ? AND completion_date = ?",
    taskId,
    completionDate,
  );
}

export async function insertScheduleChange(change: ScheduleChange): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO schedule_changes (id, changed_at, task_ids, previous_dates, new_dates, reason)
     VALUES (?, ?, ?, ?, ?, ?)`,
    change.id,
    change.changedAt,
    JSON.stringify(change.taskIds),
    JSON.stringify(change.previousDates),
    JSON.stringify(change.newDates),
    change.reason,
  );
}

export async function getLastScheduleChange(): Promise<ScheduleChange | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ScheduleChangeRow>(
    "SELECT * FROM schedule_changes ORDER BY changed_at DESC LIMIT 1",
  );
  return row ? rowToScheduleChange(row) : null;
}

export async function deleteScheduleChange(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM schedule_changes WHERE id = ?", id);
}

export function makeTask(input: Partial<Task> & Pick<Task, "title">): Task {
  const now = new Date().toISOString();
  return {
    id: createId(),
    folderId: input.folderId ?? null,
    title: input.title,
    description: input.description ?? "",
    scheduledDate: input.scheduledDate ?? todayKey(),
    durationHours: input.durationHours ?? 2,
    defaultedDuration: input.defaultedDuration ?? false,
    energyType: input.energyType ?? "deep",
    sequenceIndex: input.sequenceIndex ?? null,
    sequenceGroupId: input.sequenceGroupId ?? null,
    status: input.status ?? "todo",
    recurrenceType: input.recurrenceType ?? null,
    recurrenceDaysOfWeek: input.recurrenceDaysOfWeek ?? [],
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
  };
}

function rowToFolder(row: FolderRow): Folder {
  return {
    id: row.id,
    name: row.name,
    colorHex: row.color_hex,
    createdAt: row.created_at,
  };
}

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    folderId: row.folder_id,
    title: row.title,
    description: row.description,
    scheduledDate: row.scheduled_date,
    durationHours: row.duration_hours,
    defaultedDuration: row.defaulted_duration === 1,
    energyType: parseEnergy(row.energy_type),
    sequenceIndex: row.sequence_index,
    sequenceGroupId: row.sequence_group_id,
    status: parseStatus(row.status),
    recurrenceType: parseRecurrence(row.recurrence_type),
    recurrenceDaysOfWeek: JSON.parse(row.recurrence_days_of_week ?? "[]"),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToChecklist(row: ChecklistRow): ChecklistItem {
  return {
    id: row.id,
    taskId: row.task_id,
    text: row.text,
    done: row.done === 1,
    sortOrder: row.sort_order,
  };
}

function rowToRecurringCompletion(row: RecurringCompletionRow): RecurringCompletion {
  return {
    id: row.id,
    recurringTaskId: row.recurring_task_id,
    completionDate: row.completion_date,
    completedAt: row.completed_at,
  };
}

function rowToScheduleChange(row: ScheduleChangeRow): ScheduleChange {
  return {
    id: row.id,
    changedAt: row.changed_at,
    taskIds: JSON.parse(row.task_ids),
    previousDates: JSON.parse(row.previous_dates),
    newDates: JSON.parse(row.new_dates),
    reason: row.reason === "cascade-shift" ? "cascade-shift" : "manual-reschedule",
  };
}

function parseEnergy(value: string): EnergyType {
  if (value === "light" || value === "admin") return value;
  return "deep";
}

function parseStatus(value: string): TaskStatus {
  if (value === "done" || value === "skipped") return value;
  return "todo";
}

function parseRecurrence(value: string | null): RecurrenceType | null {
  if (value === "daily" || value === "weekly" || value === "specific_days") return value;
  return null;
}

type FolderRow = {
  id: string;
  name: string;
  color_hex: string;
  created_at: string;
};

type TaskRow = {
  id: string;
  folder_id: string | null;
  title: string;
  description: string;
  scheduled_date: string;
  duration_hours: number;
  defaulted_duration: number;
  energy_type: string;
  sequence_index: number | null;
  sequence_group_id: string | null;
  status: string;
  recurrence_type: string | null;
  recurrence_days_of_week: string;
  created_at: string;
  updated_at: string;
};

type ChecklistRow = {
  id: string;
  task_id: string;
  text: string;
  done: number;
  sort_order: number;
};

type RecurringCompletionRow = {
  id: string;
  recurring_task_id: string;
  completion_date: string;
  completed_at: string;
};

type ScheduleChangeRow = {
  id: string;
  changed_at: string;
  task_ids: string;
  previous_dates: string;
  new_dates: string;
  reason: string;
};
