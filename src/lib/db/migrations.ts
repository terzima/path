import { getDatabase } from "./database";

export async function migrate() {
  const db = await getDatabase();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      color_hex TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY NOT NULL,
      folder_id TEXT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      scheduled_date TEXT NOT NULL,
      duration_hours REAL NOT NULL DEFAULT 2,
      defaulted_duration INTEGER NOT NULL DEFAULT 0,
      energy_type TEXT NOT NULL DEFAULT 'deep',
      sequence_index INTEGER,
      sequence_group_id TEXT,
      status TEXT NOT NULL DEFAULT 'todo',
      recurrence_type TEXT,
      recurrence_days_of_week TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(folder_id) REFERENCES folders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS checklist_items (
      id TEXT PRIMARY KEY NOT NULL,
      task_id TEXT NOT NULL,
      text TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS recurring_completions (
      id TEXT PRIMARY KEY NOT NULL,
      recurring_task_id TEXT NOT NULL,
      completion_date TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      UNIQUE(recurring_task_id, completion_date)
    );

    CREATE TABLE IF NOT EXISTS schedule_changes (
      id TEXT PRIMARY KEY NOT NULL,
      changed_at TEXT NOT NULL,
      task_ids TEXT NOT NULL,
      previous_dates TEXT NOT NULL,
      new_dates TEXT NOT NULL,
      reason TEXT NOT NULL
    );

    INSERT OR IGNORE INTO folders (id, name, color_hex, created_at)
    VALUES ('general', 'General', '#3B82F6', '2026-05-02T00:00:00.000Z');
  `);
}
