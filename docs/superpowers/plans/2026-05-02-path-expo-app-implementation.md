# Path Expo App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full local-only iPhone MVP for Path using Expo: folders, tasks, recurring templates, CSV import review, daily overview, bulk rescheduling, optional cascade shifts, undo, and backup export.

**Architecture:** Expo React Native app developed from a Windows PC, built for iPhone through EAS Build, and persisted locally with SQLite. UI screens use Expo Router; scheduling, recurrence, import, cascade, and backup logic live in pure TypeScript modules with Jest tests.

**Tech Stack:** React Native, Expo, Expo Router, TypeScript, `expo-sqlite`, `expo-document-picker`, `expo-file-system`, `expo-sharing`, `papaparse`, Jest, React Native Testing Library, EAS Build.

---

## Preflight Notes

- App name: `Path`.
- Bundle identifier: `com.terzima.path`.
- Primary device target: iPhone 17 Pro.
- Development machine: Windows PC.
- iOS builds: EAS cloud builds. Do not require a Mac.
- Privacy: local SQLite only. No accounts, backend, sync, telemetry, analytics, push notifications, Firebase, Supabase, or CloudKit.
- PDF import is not a polished MVP feature. The reliable import path is CSV. The app may allow PDF file selection later, but MVP implementation should focus on CSV.
- Commit after every task.

## Repository Structure To Create

```text
Path/
  app/
    _layout.tsx
    index.tsx
    folders/
      index.tsx
      [folderId].tsx
    modals/
      task.tsx
      folder.tsx
      import.tsx
      bulk-shift.tsx

  src/
    components/
      EmptyState.tsx
      SectionHeader.tsx
      TaskRow.tsx

    features/
      overview/
        OverviewScreen.tsx
        useOverview.ts
      folders/
        FolderDetailScreen.tsx
        FolderListScreen.tsx
      tasks/
        ChecklistEditor.tsx
        TaskForm.tsx
      import/
        ImportReviewScreen.tsx
        csvParser.ts
        documentImport.ts
        importDraft.ts
      scheduling/
        cascadeShift.ts
        scheduleEngine.ts
        undoScheduleChange.ts
      recurrence/
        recurrenceEngine.ts
        recurrenceTypes.ts

    lib/
      db/
        backup.ts
        database.ts
        migrations.ts
        queries.ts
      dates.ts
      types.ts

  __tests__/
    cascadeShift.test.ts
    csvParser.test.ts
    recurrenceEngine.test.ts
    scheduleEngine.test.ts

  app.json
  eas.json
  package.json
  tsconfig.json
```

---

### Task 1: Scaffold Expo App For Windows PC Development

**Files:**
- Create: `package.json`
- Create: `app.json`
- Create: `eas.json`
- Create: `tsconfig.json`
- Create: `app/_layout.tsx`
- Create: `app/index.tsx`

- [ ] **Step 1: Create the Expo project**

Run from `C:\Users\sloui\path`:

```powershell
npx create-expo-app@latest . --template blank-typescript
```

Expected: Expo TypeScript app files are created in the current repo.

- [ ] **Step 2: Install runtime dependencies**

```powershell
npx expo install expo-router expo-sqlite expo-document-picker expo-file-system expo-sharing react-native-safe-area-context react-native-screens
npm install papaparse
npm install -D jest jest-expo @types/jest @types/papaparse
```

Expected: `package.json` includes Expo Router, SQLite, document picker, file system, sharing, Papa Parse, and Jest.

- [ ] **Step 3: Configure package scripts**

Update `package.json` scripts:

```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "web": "expo start --web",
    "test": "jest",
    "test:watch": "jest --watch",
    "typecheck": "tsc --noEmit"
  },
  "jest": {
    "preset": "jest-expo"
  }
}
```

- [ ] **Step 4: Configure Expo app**

Update `app.json`:

```json
{
  "expo": {
    "name": "Path",
    "slug": "path",
    "scheme": "path",
    "orientation": "portrait",
    "ios": {
      "bundleIdentifier": "com.terzima.path",
      "supportsTablet": false
    },
    "plugins": ["expo-router", "expo-sqlite"],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

- [ ] **Step 5: Configure EAS**

Create `eas.json`:

```json
{
  "cli": {
    "version": ">= 7.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "slouis@terzima.com",
        "ascAppId": "",
        "appleTeamId": ""
      }
    }
  }
}
```

Leave `ascAppId` and `appleTeamId` blank until EAS identifies the Apple Developer account/app record.

- [ ] **Step 6: Add Expo Router shell**

Create `app/_layout.tsx`:

```tsx
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Path" }} />
      <Stack.Screen name="folders/index" options={{ title: "Folders" }} />
      <Stack.Screen name="folders/[folderId]" options={{ title: "Folder" }} />
      <Stack.Screen name="modals/task" options={{ presentation: "modal", title: "Task" }} />
      <Stack.Screen name="modals/folder" options={{ presentation: "modal", title: "Folder" }} />
      <Stack.Screen name="modals/import" options={{ presentation: "modal", title: "Import" }} />
      <Stack.Screen name="modals/bulk-shift" options={{ presentation: "modal", title: "Bulk Shift" }} />
    </Stack>
  );
}
```

Create `app/index.tsx`:

```tsx
import { Text, View } from "react-native";

export default function IndexRoute() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Path</Text>
    </View>
  );
}
```

- [ ] **Step 7: Verify scaffold**

```powershell
npm run typecheck
npm test -- --runInBand
```

Expected: typecheck passes; Jest runs with no tests or passes existing default tests.

- [ ] **Step 8: Commit**

```powershell
git add .
git commit -m "chore: scaffold Expo app"
```

---

### Task 2: Add Core Types, Date Helpers, And SQLite Schema

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/dates.ts`
- Create: `src/lib/db/database.ts`
- Create: `src/lib/db/migrations.ts`
- Create: `src/lib/db/queries.ts`

- [ ] **Step 1: Add shared types**

Create `src/lib/types.ts`:

```ts
export type EnergyType = "deep" | "light" | "admin";
export type TaskStatus = "todo" | "done" | "skipped";
export type RecurrenceType = "daily" | "weekly" | "specific_days";
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
```

- [ ] **Step 2: Add date helpers**

Create `src/lib/dates.ts`:

```ts
export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(dateKey: string, days: number): string {
  const date = fromDateKey(dateKey);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

export function fromDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function todayKey(now = new Date()): string {
  return toDateKey(now);
}

export function weekdayNumber(dateKey: string): number {
  const jsDay = fromDateKey(dateKey).getDay();
  return jsDay === 0 ? 7 : jsDay;
}
```

- [ ] **Step 3: Add database connection**

Create `src/lib/db/database.ts`:

```ts
import * as SQLite from "expo-sqlite";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync("path.db");
  }
  return dbPromise;
}
```

- [ ] **Step 4: Add migrations**

Create `src/lib/db/migrations.ts`:

```ts
import { getDatabase } from "./database";

export async function migrate() {
  const db = await getDatabase();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

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
      completed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS schedule_changes (
      id TEXT PRIMARY KEY NOT NULL,
      changed_at TEXT NOT NULL,
      task_ids TEXT NOT NULL,
      previous_dates TEXT NOT NULL,
      new_dates TEXT NOT NULL,
      reason TEXT NOT NULL
    );
  `);
}
```

- [ ] **Step 5: Add query helpers**

Create `src/lib/db/queries.ts`:

```ts
import { randomUUID } from "expo-crypto";
import type { Folder, Task } from "../types";
import { todayKey } from "../dates";
import { getDatabase } from "./database";

export async function createFolder(name: string): Promise<Folder> {
  const folder: Folder = {
    id: randomUUID(),
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
    folder.createdAt
  );
  return folder;
}

export async function listFolders(): Promise<Folder[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>("SELECT * FROM folders ORDER BY name ASC");
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    colorHex: row.color_hex,
    createdAt: row.created_at,
  }));
}

export async function listTasks(): Promise<Task[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>("SELECT * FROM tasks ORDER BY scheduled_date ASC, sequence_index ASC");
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
    task.updatedAt
  );
}

export function makeTask(input: Partial<Task> & Pick<Task, "title">): Task {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
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

function rowToTask(row: any): Task {
  return {
    id: row.id,
    folderId: row.folder_id,
    title: row.title,
    description: row.description,
    scheduledDate: row.scheduled_date,
    durationHours: row.duration_hours,
    defaultedDuration: row.defaulted_duration === 1,
    energyType: row.energy_type,
    sequenceIndex: row.sequence_index,
    sequenceGroupId: row.sequence_group_id,
    status: row.status,
    recurrenceType: row.recurrence_type,
    recurrenceDaysOfWeek: JSON.parse(row.recurrence_days_of_week ?? "[]"),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
```

- [ ] **Step 6: Install crypto dependency**

```powershell
npx expo install expo-crypto
```

- [ ] **Step 7: Run verification**

```powershell
npm run typecheck
npm test -- --runInBand
```

Expected: typecheck passes.

- [ ] **Step 8: Commit**

```powershell
git add .
git commit -m "feat: add local SQLite data model"
```

---

### Task 3: Add Scheduling, Recurrence, CSV, And Cascade Tests

**Files:**
- Create: `src/features/import/importDraft.ts`
- Create: `src/features/scheduling/scheduleEngine.ts`
- Create: `src/features/recurrence/recurrenceEngine.ts`
- Create: `src/features/import/csvParser.ts`
- Create: `src/features/scheduling/cascadeShift.ts`
- Create: `src/features/scheduling/undoScheduleChange.ts`
- Create tests in `__tests__/`

- [ ] **Step 1: Add import draft and schedule engine**

Create `src/features/import/importDraft.ts`:

```ts
import type { EnergyType } from "../../lib/types";

export type ImportDraftTask = {
  id: string;
  sequenceIndex: number | null;
  title: string;
  description: string;
  scheduledDate: string | null;
  durationHours: number;
  defaultedDuration: boolean;
  energyType: EnergyType;
  checklistItems: string[];
  sequenceGroupId: string | null;
};
```

Create `src/features/scheduling/scheduleEngine.ts`:

```ts
import { addDays } from "../../lib/dates";
import type { ImportDraftTask } from "../import/importDraft";

export function scheduleDrafts(drafts: ImportDraftTask[], startDate: string): ImportDraftTask[] {
  return [...drafts]
    .sort((a, b) => (a.sequenceIndex ?? 999999) - (b.sequenceIndex ?? 999999))
    .map((draft, index) => ({
      ...draft,
      scheduledDate: addDays(startDate, index),
    }));
}
```

Create `__tests__/scheduleEngine.test.ts`:

```ts
import { scheduleDrafts } from "../src/features/scheduling/scheduleEngine";
import type { ImportDraftTask } from "../src/features/import/importDraft";

function draft(sequenceIndex: number, title: string): ImportDraftTask {
  return {
    id: title,
    sequenceIndex,
    title,
    description: "",
    scheduledDate: null,
    durationHours: 2,
    defaultedDuration: true,
    energyType: "deep",
    checklistItems: [],
    sequenceGroupId: "rolo",
  };
}

test("maps task sequence to consecutive real dates", () => {
  const scheduled = scheduleDrafts([draft(1, "Task 1"), draft(2, "Task 2"), draft(3, "Task 3")], "2026-05-03");
  expect(scheduled.map((task) => task.scheduledDate)).toEqual(["2026-05-03", "2026-05-04", "2026-05-05"]);
});
```

- [ ] **Step 2: Add recurrence engine**

Create `src/features/recurrence/recurrenceEngine.ts`:

```ts
import { weekdayNumber } from "../../lib/dates";
import type { RecurringCompletion, Task } from "../../lib/types";

export function isRecurringTaskDue(task: Task, dateKey: string, completions: RecurringCompletion[]): boolean {
  if (!task.recurrenceType) return false;
  if (isRecurringTaskComplete(task, dateKey, completions)) return false;
  if (dateKey < task.scheduledDate) return false;

  if (task.recurrenceType === "daily") return true;
  if (task.recurrenceType === "weekly") {
    return weekdayNumber(task.scheduledDate) === weekdayNumber(dateKey);
  }
  return task.recurrenceDaysOfWeek.includes(weekdayNumber(dateKey));
}

export function isRecurringTaskComplete(task: Task, dateKey: string, completions: RecurringCompletion[]): boolean {
  return completions.some((completion) => completion.recurringTaskId === task.id && completion.completionDate === dateKey);
}
```

Create `__tests__/recurrenceEngine.test.ts`:

```ts
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
  expect(isRecurringTaskDue(baseTask, "2026-05-05", [{
    id: "done",
    recurringTaskId: "prayer",
    completionDate: "2026-05-05",
    completedAt: "2026-05-05T10:00:00.000Z",
  }])).toBe(false);
});

test("specific day recurrence only appears on selected weekdays", () => {
  const task = { ...baseTask, recurrenceType: "specific_days" as const, recurrenceDaysOfWeek: [1, 3] };
  expect(isRecurringTaskDue(task, "2026-05-06", [])).toBe(true);
  expect(isRecurringTaskDue(task, "2026-05-07", [])).toBe(false);
});
```

- [ ] **Step 3: Add CSV parser**

Create `src/features/import/csvParser.ts`:

```ts
import Papa from "papaparse";
import { randomUUID } from "expo-crypto";
import type { EnergyType } from "../../lib/types";
import type { ImportDraftTask } from "./importDraft";

type Row = Record<string, string | undefined>;

export function parseCsvToDrafts(csv: string): ImportDraftTask[] {
  const result = Papa.parse<Row>(csv, { header: true, skipEmptyLines: true });
  return result.data
    .filter((row) => (row.title ?? "").trim().length > 0)
    .map((row) => {
      const duration = Number(row.duration);
      const hasDuration = Number.isFinite(duration) && duration > 0;
      return {
        id: randomUUID(),
        sequenceIndex: row.sequence ? Number(row.sequence) : null,
        title: row.title!.trim(),
        description: row.description ?? "",
        scheduledDate: null,
        durationHours: hasDuration ? duration : 2,
        defaultedDuration: !hasDuration,
        energyType: parseEnergy(row.energy),
        checklistItems: (row.checklist ?? "").split(";").map((item) => item.trim()).filter(Boolean),
        sequenceGroupId: row.sequenceGroupId ?? null,
      };
    });
}

function parseEnergy(value: string | undefined): EnergyType {
  if (value === "light" || value === "admin" || value === "deep") return value;
  return "deep";
}
```

Create `__tests__/csvParser.test.ts`:

```ts
import { parseCsvToDrafts } from "../src/features/import/csvParser";

test("parses CSV and defaults missing duration to 2h", () => {
  const drafts = parseCsvToDrafts(`sequence,title,description,duration,energy,checklist
1,Build model,Create tables,3,deep,"Folder;Task"
2,Build overview,,,,`);

  expect(drafts).toHaveLength(2);
  expect(drafts[0].durationHours).toBe(3);
  expect(drafts[0].defaultedDuration).toBe(false);
  expect(drafts[0].checklistItems).toEqual(["Folder", "Task"]);
  expect(drafts[1].durationHours).toBe(2);
  expect(drafts[1].defaultedDuration).toBe(true);
});
```

- [ ] **Step 4: Add cascade and undo logic**

Create `src/features/scheduling/cascadeShift.ts`:

```ts
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
  const selected = input.tasks.filter((task) => input.selectedTaskIds.includes(task.id));
  const maxSelectedSequence = Math.max(...selected.map((task) => task.sequenceIndex ?? -1));
  const folderIds = new Set(selected.map((task) => task.folderId));
  const groups = new Set(selected.map((task) => task.sequenceGroupId));
  const previousDates: Record<string, string> = {};
  const newDates: Record<string, string> = {};

  const shouldMove = (task: Task) => {
    if (input.selectedTaskIds.includes(task.id)) return true;
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
```

Create `src/features/scheduling/undoScheduleChange.ts`:

```ts
import type { ScheduleChange, Task } from "../../lib/types";

export function undoScheduleChange(tasks: Task[], change: ScheduleChange): Task[] {
  return tasks.map((task) => {
    const previousDate = change.previousDates[task.id];
    if (!previousDate) return task;
    return { ...task, scheduledDate: previousDate, updatedAt: new Date().toISOString() };
  });
}
```

Create `__tests__/cascadeShift.test.ts`:

```ts
import { shiftTasks } from "../src/features/scheduling/cascadeShift";
import type { Task } from "../src/lib/types";

function task(id: string, sequenceIndex: number, group = "rolo"): Task {
  return {
    id,
    folderId: "folder-1",
    title: id,
    description: "",
    scheduledDate: `2026-05-0${sequenceIndex}`,
    durationHours: 2,
    defaultedDuration: false,
    energyType: "deep",
    sequenceIndex,
    sequenceGroupId: group,
    status: "todo",
    recurrenceType: null,
    recurrenceDaysOfWeek: [],
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z",
  };
}

test("cascade shifts selected and later tasks in same folder and sequence group", () => {
  const result = shiftTasks({
    tasks: [task("5", 5), task("6", 6), task("other", 7, "other")],
    selectedTaskIds: ["5"],
    dayDelta: 2,
    cascade: true,
  });

  expect(result.tasks.find((item) => item.id === "5")?.scheduledDate).toBe("2026-05-07");
  expect(result.tasks.find((item) => item.id === "6")?.scheduledDate).toBe("2026-05-08");
  expect(result.tasks.find((item) => item.id === "other")?.scheduledDate).toBe("2026-05-07");
});
```

- [ ] **Step 5: Run tests**

```powershell
npm test -- --runInBand
npm run typecheck
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```powershell
git add src __tests__
git commit -m "feat: add core planning engines"
```

---

### Task 4: Build Overview, Folder, And Task UI

**Files:**
- Create: `src/components/EmptyState.tsx`
- Create: `src/components/SectionHeader.tsx`
- Create: `src/components/TaskRow.tsx`
- Create: `src/features/overview/OverviewScreen.tsx`
- Create: `src/features/folders/FolderListScreen.tsx`
- Create: `src/features/folders/FolderDetailScreen.tsx`
- Create: route files under `app/`

- [ ] **Step 1: Add shared UI components**

Create `src/components/SectionHeader.tsx`:

```tsx
import { Text, View } from "react-native";

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 }}>
      <Text style={{ fontSize: 18, fontWeight: "700" }}>{title}</Text>
      {subtitle ? <Text style={{ color: "#6B7280", marginTop: 2 }}>{subtitle}</Text> : null}
    </View>
  );
}
```

Create `src/components/EmptyState.tsx`:

```tsx
import { Text, View } from "react-native";

export function EmptyState({ title }: { title: string }) {
  return (
    <View style={{ padding: 24, alignItems: "center" }}>
      <Text style={{ color: "#6B7280" }}>{title}</Text>
    </View>
  );
}
```

Create `src/components/TaskRow.tsx`:

```tsx
import { Pressable, Text, View } from "react-native";
import type { Task } from "../lib/types";

export function TaskRow({ task, onToggle, onReschedule }: {
  task: Task;
  onToggle: () => void;
  onReschedule: () => void;
}) {
  return (
    <View style={{ paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" }}>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Pressable onPress={onToggle}>
          <Text style={{ fontSize: 22 }}>{task.status === "done" ? "✓" : "○"}</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "600" }}>{task.title}</Text>
          <Text style={{ color: "#6B7280", marginTop: 4 }}>
            {task.durationHours}h · {task.energyType}{task.defaultedDuration ? " · defaulted" : ""}
          </Text>
        </View>
        <Pressable onPress={onReschedule}>
          <Text style={{ color: "#2563EB" }}>Move</Text>
        </Pressable>
      </View>
    </View>
  );
}
```

- [ ] **Step 2: Add overview screen**

Create `src/features/overview/OverviewScreen.tsx`:

```tsx
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { EmptyState } from "../../components/EmptyState";
import { SectionHeader } from "../../components/SectionHeader";
import { TaskRow } from "../../components/TaskRow";
import { todayKey } from "../../lib/dates";
import type { Task } from "../../lib/types";
import { listTasks } from "../../lib/db/queries";

export function OverviewScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const today = todayKey();

  useEffect(() => {
    listTasks().then(setTasks);
  }, []);

  const overdue = tasks.filter((task) => !task.recurrenceType && task.status === "todo" && task.scheduledDate < today);
  const todayTasks = tasks.filter((task) => !task.recurrenceType && task.status === "todo" && task.scheduledDate === today);
  const upcoming = tasks.filter((task) => !task.recurrenceType && task.status === "todo" && task.scheduledDate > today).slice(0, 10);
  const totalHours = todayTasks.reduce((sum, task) => sum + task.durationHours, 0);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 34, fontWeight: "800" }}>Path</Text>
        <Text style={{ color: "#6B7280", marginTop: 4 }}>{totalHours} hours scheduled today</Text>
      </View>

      <SectionHeader title="Today" subtitle={today} />
      {todayTasks.length === 0 ? <EmptyState title="No work scheduled today" /> : todayTasks.map((task) => (
        <TaskRow key={task.id} task={task} onToggle={() => {}} onReschedule={() => {}} />
      ))}

      <SectionHeader title="Overdue" />
      {overdue.map((task) => <TaskRow key={task.id} task={task} onToggle={() => {}} onReschedule={() => {}} />)}

      <SectionHeader title="Upcoming" />
      {upcoming.map((task) => <TaskRow key={task.id} task={task} onToggle={() => {}} onReschedule={() => {}} />)}
    </ScrollView>
  );
}
```

Update `app/index.tsx`:

```tsx
import { OverviewScreen } from "../src/features/overview/OverviewScreen";

export default OverviewScreen;
```

- [ ] **Step 3: Add folder routes**

Create `src/features/folders/FolderListScreen.tsx` and `src/features/folders/FolderDetailScreen.tsx` with list-based screens using `listFolders()` and `listTasks()` filtered by `folderId`.

Create route files:

```tsx
// app/folders/index.tsx
export { FolderListScreen as default } from "../../src/features/folders/FolderListScreen";
```

```tsx
// app/folders/[folderId].tsx
export { FolderDetailScreen as default } from "../../src/features/folders/FolderDetailScreen";
```

- [ ] **Step 4: Verify**

```powershell
npm run typecheck
npm test -- --runInBand
npx expo start
```

Expected: Expo starts and the Overview renders on Expo Go or a development build.

- [ ] **Step 5: Commit**

```powershell
git add app src
git commit -m "feat: add overview and folder UI"
```

---

### Task 5: Add Manual Folder And Task Creation

**Files:**
- Create: `src/features/tasks/TaskForm.tsx`
- Create: `src/features/tasks/ChecklistEditor.tsx`
- Create: `app/modals/task.tsx`
- Create: `app/modals/folder.tsx`
- Modify: `src/lib/db/queries.ts`

- [ ] **Step 1: Add insert helpers for folders and tasks**

Extend `src/lib/db/queries.ts` with `updateTaskStatus`, `insertChecklistItems`, `createRecurringCompletion`, and `listChecklistItems(taskId)`.

- [ ] **Step 2: Add folder modal**

Create `app/modals/folder.tsx` with a controlled text input and a save button that calls `createFolder(name)` then `router.back()`.

- [ ] **Step 3: Add task form modal**

Create `src/features/tasks/TaskForm.tsx` with fields:

```text
title
description
folder
scheduledDate
durationHours
energyType
sequenceIndex
checklist items
recurrence off/daily/weekly/specific days
```

Create `app/modals/task.tsx` that renders `TaskForm`.

- [ ] **Step 4: Wire add buttons**

Add visible add buttons:

```text
Overview: Add Task, Import
Folders list: Add Folder
Folder detail: Add Task, Import, Bulk Shift
```

- [ ] **Step 5: Verify**

```powershell
npm run typecheck
npm test -- --runInBand
```

Manual expected result:

```text
Can create folder.
Can create task inside folder.
Can create recurring daily task.
Can create checklist items.
Task appears in Overview or folder detail.
```

- [ ] **Step 6: Commit**

```powershell
git add app src
git commit -m "feat: add manual folder and task creation"
```

---

### Task 6: Add CSV Import Review Flow

**Files:**
- Create: `src/features/import/ImportReviewScreen.tsx`
- Create: `src/features/import/documentImport.ts`
- Create: `app/modals/import.tsx`
- Modify: `src/lib/db/queries.ts`

- [ ] **Step 1: Add document import helper**

Create `src/features/import/documentImport.ts`:

```ts
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { parseCsvToDrafts } from "./csvParser";

export async function pickCsvDrafts() {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["text/csv", "text/comma-separated-values", "application/vnd.ms-excel"],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return [];
  const file = result.assets[0];
  const contents = await FileSystem.readAsStringAsync(file.uri);
  return parseCsvToDrafts(contents);
}
```

- [ ] **Step 2: Add import review screen**

Create `ImportReviewScreen.tsx` that:

```text
1. lets user pick CSV
2. displays draft rows
3. lets user choose start date
4. applies scheduleDrafts()
5. lets user edit title/date/duration
6. saves tasks with insertTask()
```

Show `defaultedDuration` as “Defaulted to 2h”.

- [ ] **Step 3: Add route**

Create `app/modals/import.tsx`:

```tsx
export { ImportReviewScreen as default } from "../../src/features/import/ImportReviewScreen";
```

- [ ] **Step 4: Verify**

Use this CSV:

```csv
sequence,title,description,duration,energy,checklist
1,Build model layer,Create SQLite schema,3,deep,Folder;Task;Checklist
2,Build overview,Today and overdue sections,,deep,
```

Expected:

```text
Second row defaults to 2h.
Sequence dates map to consecutive real dates.
Review happens before import.
Imported tasks appear in Overview and folder view.
```

- [ ] **Step 5: Commit**

```powershell
git add app src
git commit -m "feat: add CSV import review"
```

---

### Task 7: Add Bulk Reschedule, Optional Cascade, And Undo

**Files:**
- Create: `app/modals/bulk-shift.tsx`
- Modify: `src/lib/db/queries.ts`
- Modify: folder detail and overview screens

- [ ] **Step 1: Add persistence helpers**

Add query functions:

```text
updateTaskDates(tasks)
insertScheduleChange(change)
getLastScheduleChange()
deleteScheduleChange(id)
```

Schedule changes store JSON strings for `taskIds`, `previousDates`, and `newDates`.

- [ ] **Step 2: Add bulk shift modal**

Create `app/modals/bulk-shift.tsx` with:

```text
selected task list
day delta stepper
cascade future tasks toggle
confirmation text
apply button
undo last shift button
```

Default mode: move selected only. Cascade is opt-in.

- [ ] **Step 3: Wire selection mode**

In folder detail:

```text
tap checkbox to select tasks
tap Bulk Shift to open modal
apply shiftTasks()
persist changed task dates
persist schedule change
```

- [ ] **Step 4: Verify**

```powershell
npm test -- --runInBand
npm run typecheck
```

Manual expected result:

```text
Move selected only affects selected tasks.
Cascade moves later tasks in same folder and sequence group.
Other folders and recurring templates do not move.
Undo last shift restores previous dates.
```

- [ ] **Step 5: Commit**

```powershell
git add app src __tests__
git commit -m "feat: add bulk reschedule and undo"
```

---

### Task 8: Add Backup Export And EAS Build Setup

**Files:**
- Create: `src/lib/db/backup.ts`
- Modify: settings/actions in overview or folder list
- Modify: `eas.json`

- [ ] **Step 1: Add backup export**

Create `src/lib/db/backup.ts`:

```ts
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { listFolders, listTasks } from "./queries";

export async function exportBackup() {
  const payload = {
    exportedAt: new Date().toISOString(),
    folders: await listFolders(),
    tasks: await listTasks(),
  };
  const uri = `${FileSystem.cacheDirectory}path-backup.json`;
  await FileSystem.writeAsStringAsync(uri, JSON.stringify(payload, null, 2));
  await Sharing.shareAsync(uri);
}
```

- [ ] **Step 2: Add export button**

Add `Export Backup` to the folder list or overview actions menu.

- [ ] **Step 3: Log into EAS**

```powershell
npm install -g eas-cli
eas login
eas build:configure
```

Expected: EAS links project and configures iOS build metadata.

- [ ] **Step 4: Create internal iOS build**

```powershell
eas build --platform ios --profile preview
```

Expected: EAS produces an iOS build installable through Apple Developer/TestFlight/internal distribution flow.

- [ ] **Step 5: Commit**

```powershell
git add app.json eas.json src
git commit -m "feat: add backup export and EAS setup"
```

---

### Task 9: Final MVP Verification

**Files:**
- Modify any files needed for final fixes

- [ ] **Step 1: Run automated checks**

```powershell
npm run typecheck
npm test -- --runInBand
```

Expected: both pass.

- [ ] **Step 2: Run local Expo smoke test**

```powershell
npx expo start
```

Expected:

```text
Overview opens.
Folder creation works.
Task creation works.
Recurring daily/weekly/specific-day tasks render correctly.
CSV import review works.
Bulk shift selected-only works.
Bulk shift cascade works.
Undo last shift works.
Backup export opens share flow.
```

- [ ] **Step 3: Run iPhone 17 Pro build verification**

```powershell
eas build --platform ios --profile preview
```

Install on iPhone 17 Pro through the EAS/Apple Developer flow.

Expected:

```text
App launches on iPhone 17 Pro.
UI is comfortable one-handed and does not rely on desktop sidebar layout.
No login or network account setup appears.
Data persists after app close/reopen.
```

- [ ] **Step 4: Commit and push**

```powershell
git add .
git commit -m "chore: verify Expo MVP"
git push
```

---

## Plan Self-Review

Spec coverage:

- Windows PC development: Task 1 and Task 8.
- Expo React Native app: Task 1.
- EAS iOS build for Apple Developer account: Task 8 and Task 9.
- Local/private SQLite storage: Task 2.
- Folders and manual tasks: Task 5.
- Overview with today, overdue, upcoming, and total hours: Task 4.
- Recurring templates plus completion records: Task 3 and Task 5.
- CSV import with review/edit and default 2h: Task 3 and Task 6.
- Sequence to real dates: Task 3 and Task 6.
- Bulk shift, optional cascade, undo: Task 3 and Task 7.
- Backup export: Task 8.
- iPhone 17 Pro target: Task 4 and Task 9.

Intentional MVP exclusions preserved:

- No backend.
- No accounts.
- No sync.
- No telemetry or analytics.
- No push notifications.
- No calendar integration.
- No polished PDF parsing.
