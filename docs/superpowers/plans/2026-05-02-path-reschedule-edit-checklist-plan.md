# Path Reschedule, Edit, Checklist, And Recurrence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade Path's execution workflow so tasks can be edited after creation, row-level Move opens the cascade-capable shift flow, checklist items can be checked independently, Overview shows folder context plus tomorrow's tasks, and recurring tasks support monthly recurrence.

**Architecture:** Keep business rules in pure TypeScript modules and database helpers, while screens stay thin route/UI layers. Reuse the existing bulk shift modal for both single-task and multi-task moves, add edit mode to the existing task form, and preserve the local-only SQLite privacy model.

**Tech Stack:** Expo React Native, Expo Router, TypeScript, `expo-sqlite`, Jest, React Native core keyboard APIs.

---

## Scope Summary

Implement these product decisions:

- Overview shows Today, Overdue, and Tomorrow.
- A separate Upcoming route remains available for broader future planning.
- Overview task headers display `Folder - Task Name`.
- Folder pages use an `Edit` button, not `Select`, for multi-task selection.
- Folder active task lists are ordered by scheduled date, not creation/add time.
- Completed tasks leave the active folder list and appear in that folder's Archive.
- Folder Archive lets the user restore completed tasks back to active.
- Folder Archive groups completed tasks by month.
- Folder Archive allows deleting one archived task.
- Folder Archive allows selecting multiple archived tasks for bulk delete.
- Folder Archive supports deleting an entire archived month after confirmation.
- Row-level `Move` opens the same bulk shift modal with one selected task.
- Task rows also show an `Edit` action.
- Existing tasks are fully editable through the task form.
- App creates a built-in `General` folder and defaults new/imported tasks to it.
- Sequence group defaults to the selected folder when left blank.
- When a custom sequence group is typed, the task uses that group.
- When selecting a folder in Add/Edit Task, existing sequence groups from that folder are available as selectable chips.
- Editing a task prepopulates its existing sequence group.
- Task rows display sequence group context when present.
- Checklist items can be checked independently and remain visible with strikethrough until the parent task is complete.
- Forms dismiss the keyboard on drag/tap outside and keep lower checklist fields visible above the keyboard.
- Recurrence supports `monthly`, using the same day-of-month when possible and the last day of the month otherwise.

Do not add accounts, sync, notifications, calendar integration, or polished PDF parsing.

## Files To Modify Or Create

- Modify: `src/lib/types.ts`
- Modify: `src/lib/dates.ts`
- Modify: `src/lib/db/migrations.ts`
- Modify: `src/lib/db/queries.ts`
- Modify: `src/features/recurrence/recurrenceEngine.ts`
- Modify: `src/features/recurrence/recurrenceTypes.ts`
- Modify: `src/features/tasks/TaskForm.tsx`
- Modify: `src/features/tasks/ChecklistEditor.tsx`
- Modify: `src/components/TaskRow.tsx`
- Modify: `src/features/overview/useOverview.ts`
- Modify: `src/features/overview/OverviewScreen.tsx`
- Modify: `src/features/folders/FolderDetailScreen.tsx`
- Create: `src/features/folders/FolderArchiveScreen.tsx`
- Modify: `src/features/import/ImportReviewScreen.tsx`
- Modify: `src/features/scheduling/BulkShiftScreen.tsx`
- Modify: `app/_layout.tsx`
- Create: `app/upcoming.tsx`
- Create: `app/folders/[folderId]/archive.tsx`
- Create: `src/features/upcoming/UpcomingScreen.tsx`
- Create: `__tests__/monthlyRecurrence.test.ts`
- Create: `__tests__/generalFolder.test.ts`
- Create: `__tests__/checklistQueries.test.ts`
- Create: `__tests__/sequenceGroup.test.ts`

---

### Task 1: Add Monthly Recurrence Logic

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/dates.ts`
- Modify: `src/features/recurrence/recurrenceEngine.ts`
- Modify: `src/features/recurrence/recurrenceTypes.ts`
- Test: `__tests__/monthlyRecurrence.test.ts`

- [ ] **Step 1: Write the failing monthly recurrence tests**

Create `__tests__/monthlyRecurrence.test.ts`:

```ts
import { isRecurringTaskDue } from "../src/features/recurrence/recurrenceEngine";
import type { Task } from "../src/lib/types";

function monthlyTask(anchorDate: string): Task {
  return {
    id: "monthly",
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
```

- [ ] **Step 2: Run the monthly recurrence test to verify it fails**

Run:

```powershell
npm test -- --runInBand __tests__/monthlyRecurrence.test.ts
```

Expected: FAIL because `"monthly"` is not part of `RecurrenceType` and the recurrence engine has no monthly branch.

- [ ] **Step 3: Add monthly to the recurrence type**

In `src/lib/types.ts`, change:

```ts
export type RecurrenceType = "daily" | "weekly" | "specific_days";
```

to:

```ts
export type RecurrenceType = "daily" | "weekly" | "specific_days" | "monthly";
```

- [ ] **Step 4: Add date helpers for monthly recurrence**

In `src/lib/dates.ts`, add:

```ts
export function lastDayOfMonth(year: number, monthIndexZeroBased: number): number {
  return new Date(year, monthIndexZeroBased + 1, 0).getDate();
}

export function monthlyOccurrenceDay(anchorDateKey: string, targetDateKey: string): number {
  const anchor = fromDateKey(anchorDateKey);
  const target = fromDateKey(targetDateKey);
  const anchorDay = anchor.getDate();
  const targetLastDay = lastDayOfMonth(target.getFullYear(), target.getMonth());
  return Math.min(anchorDay, targetLastDay);
}
```

- [ ] **Step 5: Add monthly recurrence branch**

In `src/features/recurrence/recurrenceEngine.ts`, update imports:

```ts
import { fromDateKey, monthlyOccurrenceDay, weekdayNumber } from "../../lib/dates";
```

Then update `isRecurringTaskDue`:

```ts
  if (task.recurrenceType === "monthly") {
    const date = fromDateKey(dateKey);
    return date.getDate() === monthlyOccurrenceDay(task.scheduledDate, dateKey);
  }
```

Place that after the weekly branch and before the specific-days return.

- [ ] **Step 6: Add monthly option in recurrence picker options**

In `src/features/recurrence/recurrenceTypes.ts`, add:

```ts
  { label: "Monthly", value: "monthly" },
```

Expected final array:

```ts
export const recurrenceOptions: Array<{ label: string; value: RecurrenceType | "off" }> = [
  { label: "Off", value: "off" },
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Specific days", value: "specific_days" },
  { label: "Monthly", value: "monthly" },
];
```

- [ ] **Step 7: Update database parse function for monthly**

In `src/lib/db/queries.ts`, update `parseRecurrence`:

```ts
function parseRecurrence(value: string | null): RecurrenceType | null {
  if (value === "daily" || value === "weekly" || value === "specific_days" || value === "monthly") return value;
  return null;
}
```

- [ ] **Step 8: Run recurrence tests**

Run:

```powershell
npm test -- --runInBand __tests__/recurrenceEngine.test.ts __tests__/monthlyRecurrence.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 9: Commit**

```powershell
git add src/lib/types.ts src/lib/dates.ts src/features/recurrence src/lib/db/queries.ts __tests__/monthlyRecurrence.test.ts
git commit -m "feat: add monthly recurrence"
```

---

### Task 2: Add General Folder Bootstrap And Default Task Folder

**Files:**
- Modify: `src/lib/db/migrations.ts`
- Modify: `src/lib/db/queries.ts`
- Modify: `src/features/tasks/TaskForm.tsx`
- Modify: `src/features/import/ImportReviewScreen.tsx`
- Test: `__tests__/generalFolder.test.ts`

- [ ] **Step 1: Write the failing General folder unit test**

Create `__tests__/generalFolder.test.ts`:

```ts
import { chooseDefaultFolderId } from "../src/lib/db/queries";
import type { Folder } from "../src/lib/types";

const folders: Folder[] = [
  { id: "rolo", name: "Rolo Dev", colorHex: "#111827", createdAt: "2026-05-02T00:00:00.000Z" },
  { id: "general", name: "General", colorHex: "#3B82F6", createdAt: "2026-05-02T00:00:00.000Z" },
];

test("defaults to General folder when no folder was supplied", () => {
  expect(chooseDefaultFolderId(folders, null)).toBe("general");
});

test("preserves explicit folder selection", () => {
  expect(chooseDefaultFolderId(folders, "rolo")).toBe("rolo");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
npm test -- --runInBand __tests__/generalFolder.test.ts
```

Expected: FAIL because `chooseDefaultFolderId` does not exist.

- [ ] **Step 3: Seed the built-in General folder during migration**

In `src/lib/db/migrations.ts`, after table creation SQL, add this statement inside the same `execAsync` string:

```sql
    INSERT OR IGNORE INTO folders (id, name, color_hex, created_at)
    VALUES ('general', 'General', '#3B82F6', '2026-05-02T00:00:00.000Z');
```

- [ ] **Step 4: Add default folder helper**

In `src/lib/db/queries.ts`, add:

```ts
export function chooseDefaultFolderId(folders: Folder[], explicitFolderId: string | null | undefined): string {
  if (explicitFolderId) return explicitFolderId;
  return folders.find((folder) => folder.name.toLowerCase() === "general")?.id ?? folders[0]?.id ?? "general";
}
```

- [ ] **Step 5: Make Add Task default to General**

In `src/features/tasks/TaskForm.tsx`, change the folder loading effect:

```ts
  useEffect(() => {
    listFolders().then((nextFolders) => {
      setFolders(nextFolders);
      setSelectedFolderId(chooseDefaultFolderId(nextFolders, folderId ?? null));
    });
  }, [folderId]);
```

Update imports:

```ts
import { chooseDefaultFolderId, insertChecklistItems, insertTask, listFolders, makeTask } from "../../lib/db/queries";
```

Remove the `None` option from the folder picker. Change:

```tsx
options={[{ label: "None", value: "" }, ...folders.map((folder) => ({ label: folder.name, value: folder.id }))]}
```

to:

```tsx
options={folders.map((folder) => ({ label: folder.name, value: folder.id }))}
```

- [ ] **Step 6: Make Overview imports default to General**

In `src/features/import/ImportReviewScreen.tsx`, import and use folders:

```ts
import { chooseDefaultFolderId, insertChecklistItems, insertTask, listFolders, makeTask } from "../../lib/db/queries";
import type { Folder } from "../../lib/types";
```

Add state:

```ts
const [folders, setFolders] = useState<Folder[]>([]);
```

Add effect:

```ts
useEffect(() => {
  listFolders().then(setFolders);
}, []);
```

When saving, compute:

```ts
const resolvedFolderId = chooseDefaultFolderId(folders, folderId ?? null);
```

Then use:

```ts
folderId: resolvedFolderId,
sequenceGroupId: draft.sequenceGroupId ?? resolvedFolderId,
```

- [ ] **Step 7: Run General folder tests**

Run:

```powershell
npm test -- --runInBand __tests__/generalFolder.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit**

```powershell
git add src/lib/db src/features/tasks/TaskForm.tsx src/features/import/ImportReviewScreen.tsx __tests__/generalFolder.test.ts
git commit -m "feat: default tasks to General folder"
```

---

### Task 3: Add Task Editing And Row Edit Buttons

**Files:**
- Modify: `src/lib/db/queries.ts`
- Modify: `src/features/tasks/TaskForm.tsx`
- Modify: `src/components/TaskRow.tsx`
- Modify: `src/features/overview/OverviewScreen.tsx`
- Modify: `src/features/folders/FolderDetailScreen.tsx`
- Test: `__tests__/sequenceGroup.test.ts`

- [ ] **Step 1: Write sequence group defaulting tests**

Create `__tests__/sequenceGroup.test.ts`:

```ts
import { chooseSequenceGroup, uniqueSequenceGroups } from "../src/lib/db/queries";
import type { Task } from "../src/lib/types";

function task(sequenceGroupId: string | null): Task {
  return {
    id: sequenceGroupId ?? "empty",
    folderId: "rolo",
    title: "Task",
    description: "",
    scheduledDate: "2026-05-03",
    durationHours: 2,
    defaultedDuration: false,
    energyType: "deep",
    sequenceIndex: null,
    sequenceGroupId,
    status: "todo",
    recurrenceType: null,
    recurrenceDaysOfWeek: [],
    createdAt: "2026-05-03T00:00:00.000Z",
    updatedAt: "2026-05-03T00:00:00.000Z",
  };
}

test("sequence group defaults to selected folder when blank", () => {
  expect(chooseSequenceGroup("", "rolo")).toBe("rolo");
});

test("sequence group uses typed custom group when present", () => {
  expect(chooseSequenceGroup("Phase 2", "rolo")).toBe("Phase 2");
});

test("unique sequence groups are extracted from folder tasks", () => {
  expect(uniqueSequenceGroups([task("rolo"), task("Phase 2"), task("Phase 2"), task(null)])).toEqual([
    "Phase 2",
    "rolo",
  ]);
});
```

- [ ] **Step 2: Run sequence group tests to verify they fail**

Run:

```powershell
npm test -- --runInBand __tests__/sequenceGroup.test.ts
```

Expected: FAIL because `chooseSequenceGroup` and `uniqueSequenceGroups` do not exist.

- [ ] **Step 3: Add sequence group helpers**

In `src/lib/db/queries.ts`, add:

```ts
export function chooseSequenceGroup(input: string, selectedFolderId: string | null): string | null {
  const trimmed = input.trim();
  if (trimmed) return trimmed;
  return selectedFolderId;
}

export function uniqueSequenceGroups(tasks: Task[]): string[] {
  return Array.from(
    new Set(
      tasks
        .map((task) => task.sequenceGroupId)
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort((a, b) => a.localeCompare(b));
}

export async function listSequenceGroupsForFolder(folderId: string): Promise<string[]> {
  const tasks = await listTasksForFolder(folderId);
  return uniqueSequenceGroups(tasks);
}
```

- [ ] **Step 4: Add task lookup and update helpers**

In `src/lib/db/queries.ts`, add:

```ts
export async function getTask(taskId: string): Promise<Task | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<TaskRow>("SELECT * FROM tasks WHERE id = ?", taskId);
  return row ? rowToTask(row) : null;
}

export async function updateTask(task: Task): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE tasks SET
      folder_id = ?,
      title = ?,
      description = ?,
      scheduled_date = ?,
      duration_hours = ?,
      defaulted_duration = ?,
      energy_type = ?,
      sequence_index = ?,
      sequence_group_id = ?,
      status = ?,
      recurrence_type = ?,
      recurrence_days_of_week = ?,
      updated_at = ?
     WHERE id = ?`,
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
    new Date().toISOString(),
    task.id,
  );
}

export async function replaceChecklistItems(taskId: string, itemTexts: string[]): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM checklist_items WHERE task_id = ?", taskId);
  await insertChecklistItems(taskId, itemTexts);
}
```

- [ ] **Step 5: Convert TaskForm into create/edit mode**

In `src/features/tasks/TaskForm.tsx`, read `taskId`:

```ts
const { folderId, taskId } = useLocalSearchParams<{ folderId?: string; taskId?: string }>();
```

Update imports:

```ts
import {
  chooseDefaultFolderId,
  getTask,
  insertChecklistItems,
  insertTask,
  listChecklistItems,
  listFolders,
  listSequenceGroupsForFolder,
  makeTask,
  replaceChecklistItems,
  chooseSequenceGroup,
  updateTask,
} from "../../lib/db/queries";
```

Add an effect that loads existing task fields when `taskId` exists:

```ts
useEffect(() => {
  async function loadTask() {
    if (!taskId) return;
    const task = await getTask(taskId);
    if (!task) return;
    const items = await listChecklistItems(taskId);
    setTitle(task.title);
    setDescription(task.description);
    setScheduledDate(task.scheduledDate);
    setDurationHours(String(task.durationHours));
    setEnergyType(task.energyType);
    setSequenceIndex(task.sequenceIndex ? String(task.sequenceIndex) : "");
    setSequenceGroupId(task.sequenceGroupId ?? "");
    setSelectedFolderId(task.folderId);
    setRecurrenceType(task.recurrenceType ?? "off");
    setRecurrenceDaysOfWeek(task.recurrenceDaysOfWeek);
    setChecklistItems(items.map((item) => item.text));
  }
  loadTask();
}, [taskId]);
```

Add state for selectable sequence groups:

```ts
const [sequenceGroupOptions, setSequenceGroupOptions] = useState<string[]>([]);
```

Add an effect that refreshes selectable sequence groups whenever the selected folder changes:

```ts
useEffect(() => {
  if (!selectedFolderId) {
    setSequenceGroupOptions([]);
    return;
  }
  listSequenceGroupsForFolder(selectedFolderId).then(setSequenceGroupOptions);
}, [selectedFolderId]);
```

In `save()`, branch:

```ts
if (taskId) {
  const existing = await getTask(taskId);
  if (!existing) return;
  await updateTask({
    ...existing,
    title: trimmed,
    description,
    folderId: selectedFolderId,
    scheduledDate,
    durationHours: Number.isFinite(parsedDuration) && parsedDuration > 0 ? parsedDuration : 2,
    defaultedDuration: !(Number.isFinite(parsedDuration) && parsedDuration > 0),
    energyType,
    sequenceIndex: sequenceIndex ? Number(sequenceIndex) : null,
    sequenceGroupId: chooseSequenceGroup(sequenceGroupId, selectedFolderId),
    recurrenceType: recurrenceType === "off" ? null : recurrenceType,
    recurrenceDaysOfWeek: recurrenceType === "specific_days" ? recurrenceDaysOfWeek : [],
  });
  await replaceChecklistItems(taskId, checklistItems);
  router.back();
  return;
}
```

Keep the existing create path after that branch.

In the create path, also replace:

```ts
sequenceGroupId: sequenceGroupId.trim() || selectedFolderId,
```

with:

```ts
sequenceGroupId: chooseSequenceGroup(sequenceGroupId, selectedFolderId),
```

Below the `Sequence group` text field, render selectable existing groups:

```tsx
{sequenceGroupOptions.length > 0 ? (
  <ButtonGroup
    label="Existing sequence groups"
    options={sequenceGroupOptions.map((group) => ({ label: group, value: group }))}
    value={sequenceGroupId}
    onChange={setSequenceGroupId}
  />
) : null}
```

This keeps the field free-form for new sequence groups while making existing folder groups easy to reuse. Editing an existing task already prepopulates its current sequence group through `setSequenceGroupId(task.sequenceGroupId ?? "")`.

Update title text:

```tsx
<Text style={{ color: "#111827", fontSize: 30, fontWeight: "900" }}>{taskId ? "Edit Task" : "Add Task"}</Text>
```

Update save button:

```tsx
<Text style={{ color: "#FFFFFF", fontWeight: "900", textAlign: "center" }}>{taskId ? "Save Changes" : "Save Task"}</Text>
```

- [ ] **Step 6: Add Edit button and sequence group display to task rows**

In `src/components/TaskRow.tsx`, add prop:

```ts
onEdit?: () => void;
sequenceGroupLabel?: string | null;
```

Inside `TaskRow`, compute:

```ts
const visibleSequenceGroup = sequenceGroupLabel ?? task.sequenceGroupId;
```

Render next to Move:

```tsx
{onEdit ? (
  <Pressable onPress={onEdit} hitSlop={10}>
    <Text style={{ color: "#2563EB", fontWeight: "700" }}>Edit</Text>
  </Pressable>
) : null}
```

Keep `Move` as a separate adjacent action.

In the task metadata line, append the sequence group when present:

```tsx
{visibleSequenceGroup ? ` - ${visibleSequenceGroup}` : ""}
```

- [ ] **Step 7: Wire Edit from Overview and Folder pages**

In `OverviewScreen.tsx`, pass:

```tsx
onEdit={() => router.push({ pathname: "/modals/task", params: { taskId: task.id } })}
```

to every `TaskRow`.

Also pass:

```tsx
sequenceGroupLabel={task.sequenceGroupId}
```

so Overview rows show folder context and sequence context.

In `FolderDetailScreen.tsx`, pass:

```tsx
onEdit={() => router.push({ pathname: "/modals/task", params: { taskId: task.id, folderId } })}
```

Also pass:

```tsx
sequenceGroupLabel={task.sequenceGroupId}
```

Folder detail does not need to repeat the folder name, but it should show the sequence group because that explains what cascade will affect.

- [ ] **Step 8: Run verification**

Run:

```powershell
npm run typecheck
npm test -- --runInBand __tests__/sequenceGroup.test.ts
npm test -- --runInBand
```

Expected: PASS.

- [ ] **Step 9: Commit**

```powershell
git add src/lib/db/queries.ts src/features/tasks/TaskForm.tsx src/components/TaskRow.tsx src/features/overview/OverviewScreen.tsx src/features/folders/FolderDetailScreen.tsx __tests__/sequenceGroup.test.ts
git commit -m "feat: edit existing tasks"
```

---

### Task 4: Rework Move To Use Bulk Shift For Single And Multiple Tasks

**Files:**
- Modify: `src/features/overview/OverviewScreen.tsx`
- Modify: `src/features/folders/FolderDetailScreen.tsx`
- Modify: `src/features/scheduling/BulkShiftScreen.tsx`
- Modify: `src/lib/db/queries.ts`

- [ ] **Step 1: Add task-by-id list helper for single task moves**

In `src/lib/db/queries.ts`, add:

```ts
export async function listTasksForShift(folderId: string | null, selectedTaskIds: string[]): Promise<Task[]> {
  if (folderId) return listTasksForFolder(folderId);
  const allTasks = await listTasks();
  const selected = allTasks.filter((task) => selectedTaskIds.includes(task.id));
  const selectedFolderIds = new Set(selected.map((task) => task.folderId).filter(Boolean));
  if (selectedFolderIds.size === 1) {
    const [selectedFolderId] = Array.from(selectedFolderIds);
    return listTasksForFolder(selectedFolderId!);
  }
  return allTasks;
}
```

- [ ] **Step 2: Remove automatic move-to-tomorrow behavior**

In `src/features/overview/OverviewScreen.tsx`, delete:

```ts
async function moveToTomorrow(task: Task) {
  await updateTaskDate(task.id, addDays(today, 1));
  await refresh();
}
```

Remove imports for `updateTaskDate` and `addDays`.

Add:

```ts
function openMove(task: Task) {
  router.push({
    pathname: "/modals/bulk-shift",
    params: {
      folderId: task.folderId ?? "",
      selectedTaskIds: task.id,
    },
  });
}
```

Then change every `onReschedule={() => moveToTomorrow(task)}` to:

```tsx
onReschedule={() => openMove(task)}
```

- [ ] **Step 3: Make BulkShiftScreen load enough tasks for cascade**

In `src/features/scheduling/BulkShiftScreen.tsx`, replace:

```ts
if (folderId) listTasksForFolder(folderId).then(setTasks);
```

with:

```ts
listTasksForShift(folderId || null, selectedIds).then(setTasks);
```

Update imports:

```ts
  listTasksForShift,
```

- [ ] **Step 4: Rename folder selection mode to Edit**

In `src/features/folders/FolderDetailScreen.tsx`, add:

```ts
const [editing, setEditing] = useState(false);
```

Add an `Edit` button in the top controls:

```tsx
<Pressable
  onPress={() => {
    setEditing((value) => !value);
    setSelectedTaskIds([]);
  }}
  style={secondaryButton}
>
  <Text style={secondaryText}>{editing ? "Done" : "Edit"}</Text>
</Pressable>
```

Only show `Bulk Shift` / `Move Selected` when `editing` is true:

```tsx
{editing ? (
  <Pressable
    disabled={selectedTaskIds.length === 0}
    onPress={() => router.push({ pathname: "/modals/bulk-shift", params: { folderId, selectedTaskIds: selectedParam } })}
    style={[secondaryButton, selectedTaskIds.length === 0 ? { opacity: 0.45 } : null]}
  >
    <Text style={secondaryText}>Move Selected</Text>
  </Pressable>
) : null}
```

Pass `onSelect` to `TaskRow` only when `editing`:

```tsx
selected={editing && selectedTaskIds.includes(task.id)}
onSelect={editing ? () => toggleSelection(task.id) : undefined}
```

In normal mode, `Move` still appears and opens the single-task bulk shift modal:

```tsx
onReschedule={() =>
  router.push({ pathname: "/modals/bulk-shift", params: { folderId, selectedTaskIds: task.id } })
}
```

- [ ] **Step 5: Run verification**

Run:

```powershell
npm run typecheck
npm test -- --runInBand
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/features/overview/OverviewScreen.tsx src/features/folders/FolderDetailScreen.tsx src/features/scheduling/BulkShiftScreen.tsx src/lib/db/queries.ts
git commit -m "feat: route task moves through bulk shift"
```

---

### Task 5: Add Checklist Item Completion

**Files:**
- Modify: `src/lib/db/queries.ts`
- Modify: `src/components/TaskRow.tsx`
- Test: `__tests__/checklistQueries.test.ts`

- [ ] **Step 1: Write checklist query unit test around pure helper**

Create `__tests__/checklistQueries.test.ts`:

```ts
import { toggleChecklistDoneValue } from "../src/lib/db/queries";

test("toggleChecklistDoneValue flips checklist completion", () => {
  expect(toggleChecklistDoneValue(false)).toBe(true);
  expect(toggleChecklistDoneValue(true)).toBe(false);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
npm test -- --runInBand __tests__/checklistQueries.test.ts
```

Expected: FAIL because `toggleChecklistDoneValue` does not exist.

- [ ] **Step 3: Add checklist toggle helpers**

In `src/lib/db/queries.ts`, add:

```ts
export function toggleChecklistDoneValue(done: boolean): boolean {
  return !done;
}

export async function updateChecklistItemDone(itemId: string, done: boolean): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("UPDATE checklist_items SET done = ? WHERE id = ?", done ? 1 : 0, itemId);
}
```

- [ ] **Step 4: Make checklist items tappable and persistent**

In `src/components/TaskRow.tsx`, import:

```ts
import { listChecklistItems, updateChecklistItemDone } from "../lib/db/queries";
```

Add function inside component:

```ts
async function toggleChecklistItem(item: ChecklistItem) {
  await updateChecklistItemDone(item.id, !item.done);
  setChecklistItems((current) =>
    current.map((currentItem) =>
      currentItem.id === item.id ? { ...currentItem, done: !currentItem.done } : currentItem,
    ),
  );
}
```

Change checklist rendering from text-only to pressable:

```tsx
<Pressable key={item.id} onPress={() => toggleChecklistItem(item)}>
  <Text
    style={{
      color: item.done ? "#6B7280" : "#4B5563",
      fontSize: 13,
      textDecorationLine: item.done ? "line-through" : "none",
    }}
  >
    {item.done ? "[x]" : "[ ]"} {item.text}
  </Text>
</Pressable>
```

Do not auto-complete parent task when all checklist items are checked.

- [ ] **Step 5: Run verification**

Run:

```powershell
npm test -- --runInBand __tests__/checklistQueries.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/lib/db/queries.ts src/components/TaskRow.tsx __tests__/checklistQueries.test.ts
git commit -m "feat: toggle checklist items"
```

---

### Task 6: Add Overview Folder Context And Tomorrow Section

**Files:**
- Modify: `src/lib/db/queries.ts`
- Modify: `src/features/overview/useOverview.ts`
- Modify: `src/features/overview/OverviewScreen.tsx`
- Modify: `src/components/TaskRow.tsx`
- Create: `app/upcoming.tsx`
- Create: `src/features/upcoming/UpcomingScreen.tsx`
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Add folder map helper**

In `src/lib/db/queries.ts`, add:

```ts
export async function folderNameById(): Promise<Record<string, string>> {
  const folders = await listFolders();
  return Object.fromEntries(folders.map((folder) => [folder.id, folder.name]));
}
```

- [ ] **Step 2: Add tomorrow tasks to overview hook**

In `src/features/overview/useOverview.ts`, import:

```ts
import { addDays } from "../../lib/dates";
```

Add:

```ts
const tomorrow = addDays(today, 1);
const tomorrowTasks = tasks.filter((task) => !task.recurrenceType && task.status === "todo" && task.scheduledDate === tomorrow);
```

Return `tomorrow` and `tomorrowTasks`.

Keep `upcoming` in the hook if the new Upcoming screen uses it, but Overview should render only Tomorrow from this point.

- [ ] **Step 3: Let TaskRow display folder context**

In `src/components/TaskRow.tsx`, add props:

```ts
folderName?: string;
showFolderName?: boolean;
```

Replace title text with:

```tsx
{showFolderName ? `${folderName ?? "General"} - ${task.title}` : task.title}
```

- [ ] **Step 4: Render folder names and Tomorrow on Overview**

In `src/features/overview/OverviewScreen.tsx`, load folder map:

```ts
const [folderNames, setFolderNames] = useState<Record<string, string>>({});
```

Import `useEffect`, `folderNameById`, and in effect:

```ts
useEffect(() => {
  folderNameById().then(setFolderNames);
}, []);
```

From hook destructure:

```ts
tomorrow,
tomorrowTasks,
```

Pass to every overview `TaskRow`:

```tsx
showFolderName
folderName={task.folderId ? folderNames[task.folderId] : "General"}
```

Replace the current `Upcoming` section with:

```tsx
<SectionHeader title="Tomorrow" subtitle={tomorrow} />
{tomorrowTasks.length === 0 ? <EmptyState title="Nothing scheduled tomorrow" /> : null}
{tomorrowTasks.map((task) => (
  <TaskRow
    key={task.id}
    task={task}
    showFolderName
    folderName={task.folderId ? folderNames[task.folderId] : "General"}
    complete={false}
    onToggle={() => toggleTask(task)}
    onReschedule={() => openMove(task)}
    onEdit={() => router.push({ pathname: "/modals/task", params: { taskId: task.id } })}
  />
))}
```

- [ ] **Step 5: Add separate Upcoming screen route**

Create `src/features/upcoming/UpcomingScreen.tsx`:

```tsx
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SectionHeader } from "../../components/SectionHeader";
import { TaskRow } from "../../components/TaskRow";
import { folderNameById, listTasks, updateTaskStatus } from "../../lib/db/queries";
import type { Task } from "../../lib/types";

export function UpcomingScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [folderNames, setFolderNames] = useState<Record<string, string>>({});

  const refresh = useCallback(async () => {
    const [nextTasks, nextFolderNames] = await Promise.all([listTasks(), folderNameById()]);
    setTasks(nextTasks.filter((task) => task.status === "todo" && !task.recurrenceType));
    setFolderNames(nextFolderNames);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const grouped = tasks.reduce<Record<string, Task[]>>((acc, task) => {
    acc[task.scheduledDate] = [...(acc[task.scheduledDate] ?? []), task];
    return acc;
  }, {});

  return (
    <ScrollView style={{ backgroundColor: "#F3F4F6", flex: 1 }}>
      <View style={{ padding: 18, paddingTop: 24 }}>
        <Text style={{ color: "#111827", fontSize: 32, fontWeight: "900" }}>Upcoming</Text>
      </View>
      {Object.entries(grouped).map(([date, dateTasks]) => (
        <View key={date}>
          <SectionHeader title={date} />
          {dateTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              showFolderName
              folderName={task.folderId ? folderNames[task.folderId] : "General"}
              complete={false}
              onToggle={async () => {
                await updateTaskStatus(task.id, "done");
                await refresh();
              }}
              onReschedule={() =>
                router.push({ pathname: "/modals/bulk-shift", params: { folderId: task.folderId ?? "", selectedTaskIds: task.id } })
              }
              onEdit={() => router.push({ pathname: "/modals/task", params: { taskId: task.id } })}
            />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
```

Create `app/upcoming.tsx`:

```tsx
export { UpcomingScreen as default } from "../src/features/upcoming/UpcomingScreen";
```

Add to `app/_layout.tsx`:

```tsx
<Stack.Screen name="upcoming" options={{ title: "Upcoming" }} />
```

Add top button in Overview:

```tsx
<Pressable onPress={() => router.push("/upcoming")} style={secondaryButtonStyle}>
  <Text style={secondaryButtonTextStyle}>Upcoming</Text>
</Pressable>
```

- [ ] **Step 6: Run verification**

Run:

```powershell
npm run typecheck
npm test -- --runInBand
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add app src
git commit -m "feat: refine overview and upcoming views"
```

---

### Task 7: Improve Keyboard Handling In Forms

**Files:**
- Modify: `src/features/tasks/TaskForm.tsx`
- Modify: `app/modals/folder.tsx`
- Modify: `src/features/import/ImportReviewScreen.tsx`
- Modify: `src/features/scheduling/BulkShiftScreen.tsx`

- [ ] **Step 1: Update TaskForm keyboard wrapper**

In `src/features/tasks/TaskForm.tsx`, update React Native imports:

```ts
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
```

Wrap the current `ScrollView`:

```tsx
<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
  <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <ScrollView
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      style={{ backgroundColor: "#F3F4F6", flex: 1 }}
      contentContainerStyle={{ gap: 14, padding: 18, paddingBottom: 120 }}
    >
      ...
    </ScrollView>
  </TouchableWithoutFeedback>
</KeyboardAvoidingView>
```

This keeps checklist inputs visible when the keyboard is open and lets the user hide the keyboard by dragging or tapping outside.

- [ ] **Step 2: Apply the same keyboard pattern to Folder modal**

In `app/modals/folder.tsx`, import:

```ts
Keyboard,
KeyboardAvoidingView,
Platform,
TouchableWithoutFeedback,
```

Wrap the root form with `KeyboardAvoidingView` and `TouchableWithoutFeedback`, using the same behavior as TaskForm.

- [ ] **Step 3: Apply the same keyboard pattern to ImportReviewScreen**

In `src/features/import/ImportReviewScreen.tsx`, wrap the root `ScrollView` in the same `KeyboardAvoidingView` and `TouchableWithoutFeedback`. Set:

```tsx
keyboardDismissMode="on-drag"
keyboardShouldPersistTaps="handled"
contentContainerStyle={{ gap: 14, padding: 18, paddingBottom: 120 }}
```

- [ ] **Step 4: Apply the same keyboard pattern to BulkShiftScreen**

Even though the current screen uses steppers, wrap it now so future exact-date inputs behave correctly:

```tsx
<KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
  <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <ScrollView keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" ...>
```

- [ ] **Step 5: Run verification**

Run:

```powershell
npm run typecheck
npm test -- --runInBand
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add app/modals/folder.tsx src/features/tasks/TaskForm.tsx src/features/import/ImportReviewScreen.tsx src/features/scheduling/BulkShiftScreen.tsx
git commit -m "feat: improve form keyboard handling"
```

---

### Task 8: Add Folder Date Ordering And Archive Cleanup

**Files:**
- Modify: `src/lib/db/queries.ts`
- Modify: `src/lib/dates.ts`
- Modify: `src/features/folders/FolderDetailScreen.tsx`
- Create: `src/features/folders/FolderArchiveScreen.tsx`
- Create: `app/folders/[folderId]/archive.tsx`
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Ensure active folder tasks are ordered by date**

In `src/lib/db/queries.ts`, update `listTasksForFolder` so it excludes completed tasks and sorts by scheduled date first:

```ts
export async function listTasksForFolder(folderId: string): Promise<Task[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TaskRow>(
    `SELECT * FROM tasks
     WHERE folder_id = ? AND status != 'done'
     ORDER BY scheduled_date ASC, sequence_index ASC, created_at ASC`,
    folderId,
  );
  return rows.map(rowToTask);
}
```

This makes the active folder screen a schedule view, not an insertion-order view.

- [ ] **Step 2: Add archive query helpers**

In `src/lib/db/queries.ts`, add:

```ts
export async function listArchivedTasksForFolder(folderId: string): Promise<Task[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TaskRow>(
    `SELECT * FROM tasks
     WHERE folder_id = ? AND status = 'done'
     ORDER BY scheduled_date DESC, updated_at DESC`,
    folderId,
  );
  return rows.map(rowToTask);
}

export async function restoreTaskToActive(taskId: string): Promise<void> {
  await updateTaskStatus(taskId, "todo");
}

export async function deleteTasks(taskIds: string[]): Promise<void> {
  const db = await getDatabase();
  for (const taskId of taskIds) {
    await db.runAsync("DELETE FROM tasks WHERE id = ?", taskId);
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  await deleteTasks([taskId]);
}
```

- [ ] **Step 3: Add Archive button inside folder detail**

In `src/features/folders/FolderDetailScreen.tsx`, add an Archive button in the folder top controls:

```tsx
<Pressable onPress={() => router.push(`/folders/${folderId}/archive`)} style={secondaryButton}>
  <Text style={secondaryText}>Archive</Text>
</Pressable>
```

Keep completed tasks out of the normal folder task list by relying on the updated `listTasksForFolder`.

- [ ] **Step 4: Add archive month grouping helper**

In `src/lib/dates.ts`, add:

```ts
export function monthKey(dateKey: string): string {
  return dateKey.slice(0, 7);
}

export function monthLabel(monthKeyValue: string): string {
  const [year, month] = monthKeyValue.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}
```

- [ ] **Step 5: Create folder archive screen**

Create `src/features/folders/FolderArchiveScreen.tsx`:

```tsx
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { EmptyState } from "../../components/EmptyState";
import { TaskRow } from "../../components/TaskRow";
import { deleteTasks, getFolder, listArchivedTasksForFolder, restoreTaskToActive } from "../../lib/db/queries";
import { monthKey, monthLabel } from "../../lib/dates";
import type { Folder, Task } from "../../lib/types";

export function FolderArchiveScreen() {
  const { folderId } = useLocalSearchParams<{ folderId: string }>();
  const [folder, setFolder] = useState<Folder | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editing, setEditing] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    if (!folderId) return;
    const [nextFolder, nextTasks] = await Promise.all([
      getFolder(folderId),
      listArchivedTasksForFolder(folderId),
    ]);
    setFolder(nextFolder);
    setTasks(nextTasks);
  }, [folderId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const grouped = useMemo(() => {
    return tasks.reduce<Record<string, Task[]>>((acc, task) => {
      const key = monthKey(task.scheduledDate);
      acc[key] = [...(acc[key] ?? []), task];
      return acc;
    }, {});
  }, [tasks]);

  async function confirmDeleteMonth(key: string, monthTasks: Task[]) {
    Alert.alert(
      "Delete archived month?",
      `Delete ${monthTasks.length} completed task${monthTasks.length === 1 ? "" : "s"} from ${monthLabel(key)}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteTasks(monthTasks.map((task) => task.id));
            await refresh();
          },
        },
      ],
    );
  }

  function toggleSelected(taskId: string) {
    setSelectedTaskIds((current) =>
      current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId],
    );
  }

  async function confirmDeleteSelected() {
    Alert.alert(
      "Delete selected tasks?",
      `Delete ${selectedTaskIds.length} archived task${selectedTaskIds.length === 1 ? "" : "s"}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteTasks(selectedTaskIds);
            setSelectedTaskIds([]);
            setEditing(false);
            await refresh();
          },
        },
      ],
    );
  }

  async function confirmDeleteOne(task: Task) {
    Alert.alert(
      "Delete archived task?",
      `Delete "${task.title}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteTasks([task.id]);
            await refresh();
          },
        },
      ],
    );
  }

  return (
    <ScrollView style={{ backgroundColor: "#F3F4F6", flex: 1 }}>
      <View style={{ padding: 18, paddingTop: 24 }}>
        <Text style={{ color: "#111827", fontSize: 32, fontWeight: "900" }}>
          {folder ? `${folder.name} Archive` : "Archive"}
        </Text>
        <Text style={{ color: "#4B5563", marginTop: 4 }}>
          Completed tasks can be restored, selected for deletion, or cleaned up by month.
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
          <Pressable
            onPress={() => {
              setEditing((value) => !value);
              setSelectedTaskIds([]);
            }}
            style={{ backgroundColor: "#E5E7EB", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 }}
          >
            <Text style={{ color: "#111827", fontWeight: "900" }}>{editing ? "Done" : "Edit"}</Text>
          </Pressable>
          {editing ? (
            <Pressable
              disabled={selectedTaskIds.length === 0}
              onPress={confirmDeleteSelected}
              style={{
                backgroundColor: "#FEE2E2",
                borderRadius: 8,
                opacity: selectedTaskIds.length === 0 ? 0.45 : 1,
                paddingHorizontal: 14,
                paddingVertical: 10,
              }}
            >
              <Text style={{ color: "#B91C1C", fontWeight: "900" }}>
                Delete Selected
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {tasks.length === 0 ? <EmptyState title="No archived tasks" /> : null}
      {Object.entries(grouped).map(([key, monthTasks]) => (
        <View key={key}>
          <View
            style={{
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "space-between",
              paddingHorizontal: 18,
              paddingTop: 18,
              paddingBottom: 8,
            }}
          >
            <Text style={{ color: "#111827", fontSize: 18, fontWeight: "900" }}>
              {monthLabel(key)}
            </Text>
            <Pressable onPress={() => confirmDeleteMonth(key, monthTasks)}>
              <Text style={{ color: "#B91C1C", fontWeight: "900" }}>Delete Month</Text>
            </Pressable>
          </View>

          {monthTasks.map((task) => (
            <View key={task.id}>
              <TaskRow
                task={task}
                complete
                selected={editing && selectedTaskIds.includes(task.id)}
                onSelect={editing ? () => toggleSelected(task.id) : undefined}
                onToggle={async () => {
                  await restoreTaskToActive(task.id);
                  await refresh();
                }}
                onEdit={() => router.push({ pathname: "/modals/task", params: { taskId: task.id, folderId } })}
              />
              <View style={{ flexDirection: "row", gap: 10, marginHorizontal: 14, marginBottom: 10 }}>
                <Pressable
                  onPress={async () => {
                    await restoreTaskToActive(task.id);
                    await refresh();
                  }}
                  style={{ backgroundColor: "#E5E7EB", borderRadius: 8, flex: 1, padding: 12 }}
                >
                  <Text style={{ color: "#111827", fontWeight: "900", textAlign: "center" }}>
                    Restore
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => confirmDeleteOne(task)}
                  style={{ backgroundColor: "#FEE2E2", borderRadius: 8, flex: 1, padding: 12 }}
                >
                  <Text style={{ color: "#B91C1C", fontWeight: "900", textAlign: "center" }}>
                    Delete
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
```

- [ ] **Step 6: Add archive route**

Create `app/folders/[folderId]/archive.tsx`:

```tsx
export { FolderArchiveScreen as default } from "../../../src/features/folders/FolderArchiveScreen";
```

In `app/_layout.tsx`, add:

```tsx
<Stack.Screen name="folders/[folderId]/archive" options={{ title: "Archive" }} />
```

- [ ] **Step 7: Run verification**

Run:

```powershell
npm run typecheck
npm test -- --runInBand
```

Expected: PASS.

- [ ] **Step 8: Commit**

```powershell
git add app src
git commit -m "feat: add archive cleanup controls"
```

---

### Task 9: Fix Recurring Folder State And Occurrence Windows

**Files:**
- Modify: `src/features/recurrence/recurrenceEngine.ts`
- Modify: `src/features/overview/useOverview.ts`
- Modify: `src/features/folders/FolderDetailScreen.tsx`
- Modify: `src/components/TaskRow.tsx`
- Test: `__tests__/recurrenceWindow.test.ts`

- [ ] **Step 1: Write recurrence window tests**

Create `__tests__/recurrenceWindow.test.ts`:

```ts
import { getCurrentOccurrenceDate, isRecurringTaskOverdue } from "../src/features/recurrence/recurrenceEngine";
import type { RecurringCompletion, Task } from "../src/lib/types";

function recurringTask(recurrenceType: Task["recurrenceType"], scheduledDate: string, days: number[] = []): Task {
  return {
    id: `${recurrenceType}-${scheduledDate}`,
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
```

- [ ] **Step 2: Run recurrence window tests to verify they fail**

Run:

```powershell
npm test -- --runInBand __tests__/recurrenceWindow.test.ts
```

Expected: FAIL because `getCurrentOccurrenceDate` and `isRecurringTaskOverdue` do not exist.

- [ ] **Step 3: Add occurrence helpers to recurrence engine**

In `src/features/recurrence/recurrenceEngine.ts`, add:

```ts
import { addDays, fromDateKey, monthlyOccurrenceDay, toDateKey, weekdayNumber } from "../../lib/dates";
```

Then add these functions:

```ts
export function getCurrentOccurrenceDate(task: Task, dateKey: string): string | null {
  if (!task.recurrenceType || dateKey < task.scheduledDate) return null;

  if (task.recurrenceType === "daily") return dateKey;

  let cursor = task.scheduledDate;
  let latest: string | null = null;

  while (cursor <= dateKey) {
    if (isOccurrenceDate(task, cursor)) latest = cursor;
    cursor = addDays(cursor, 1);
  }

  return latest;
}

export function getNextOccurrenceDate(task: Task, afterDateKey: string): string | null {
  if (!task.recurrenceType) return null;
  let cursor = addDays(afterDateKey, 1);
  for (let index = 0; index < 370; index += 1) {
    if (cursor >= task.scheduledDate && isOccurrenceDate(task, cursor)) return cursor;
    cursor = addDays(cursor, 1);
  }
  return null;
}

export function isOccurrenceDate(task: Task, dateKey: string): boolean {
  if (!task.recurrenceType || dateKey < task.scheduledDate) return false;
  if (task.recurrenceType === "daily") return true;
  if (task.recurrenceType === "weekly") {
    return weekdayNumber(task.scheduledDate) === weekdayNumber(dateKey);
  }
  if (task.recurrenceType === "specific_days") {
    return task.recurrenceDaysOfWeek.includes(weekdayNumber(dateKey));
  }
  const date = fromDateKey(dateKey);
  return date.getDate() === monthlyOccurrenceDay(task.scheduledDate, dateKey);
}

export function isRecurringTaskOverdue(
  task: Task,
  dateKey: string,
  completions: RecurringCompletion[],
): boolean {
  const currentOccurrence = getCurrentOccurrenceDate(task, dateKey);
  if (!currentOccurrence) return false;
  if (currentOccurrence === dateKey) return false;
  return !isRecurringTaskComplete(task, currentOccurrence, completions);
}
```

Update `isRecurringTaskDue` to use `isOccurrenceDate`:

```ts
export function isRecurringTaskDue(
  task: Task,
  dateKey: string,
  completions: RecurringCompletion[],
): boolean {
  if (!task.recurrenceType) return false;
  if (!isOccurrenceDate(task, dateKey)) return false;
  if (isRecurringTaskComplete(task, dateKey, completions)) return false;
  return true;
}
```

This gives daily a one-day window, while weekly/monthly/specific-days remain overdue until the next occurrence replaces the missed one.

- [ ] **Step 4: Update Overview to show recurring overdue correctly**

In `src/features/overview/useOverview.ts`, import:

```ts
import { isRecurringTaskDue, isRecurringTaskOverdue } from "../recurrence/recurrenceEngine";
```

Update `overdue` so it includes recurring overdue windows:

```ts
const overdue = tasks.filter((task) => {
  if (task.recurrenceType) return isRecurringTaskOverdue(task, today, completions);
  return task.status === "todo" && task.scheduledDate < today;
});
```

Keep `recurringDue` based on `isRecurringTaskDue(task, today, completions)`.

- [ ] **Step 5: Update folder rows to show recurring completion state**

In `src/features/folders/FolderDetailScreen.tsx`, load completions:

```ts
import { listRecurringCompletions } from "../../lib/db/queries";
import type { RecurringCompletion } from "../../lib/types";
import { isRecurringTaskComplete, isRecurringTaskDue, isRecurringTaskOverdue } from "../recurrence/recurrenceEngine";
import { todayKey } from "../../lib/dates";
```

Add state:

```ts
const [completions, setCompletions] = useState<RecurringCompletion[]>([]);
const today = todayKey();
```

In `refresh`, load completions:

```ts
const [nextFolder, nextTasks, nextCompletions] = await Promise.all([
  getFolder(folderId),
  listTasksForFolder(folderId),
  listRecurringCompletions(),
]);
setCompletions(nextCompletions);
```

When rendering `TaskRow`, compute recurring state:

```tsx
const recurringComplete = task.recurrenceType ? isRecurringTaskComplete(task, today, completions) : false;
const recurringDue = task.recurrenceType ? isRecurringTaskDue(task, today, completions) : false;
const recurringOverdue = task.recurrenceType ? isRecurringTaskOverdue(task, today, completions) : false;
```

Pass:

```tsx
complete={task.recurrenceType ? recurringComplete : task.status === "done"}
statusNote={
  task.recurrenceType
    ? recurringComplete
      ? "Completed today"
      : recurringDue
        ? "Due today"
        : recurringOverdue
          ? "Overdue"
          : "Recurring template"
    : undefined
}
```

The folder row should no longer look like an uncompleted due-today task after today's recurring completion is recorded.

- [ ] **Step 6: Add status note prop to TaskRow**

In `src/components/TaskRow.tsx`, add:

```ts
statusNote?: string;
```

Render it near the metadata:

```tsx
{statusNote ? (
  <Text style={{ color: "#059669", fontSize: 13, fontWeight: "800", marginTop: 4 }}>
    {statusNote}
  </Text>
) : null}
```

Use a neutral color for `"Recurring template"` and warning color for `"Overdue"` if desired, but keep implementation simple.

- [ ] **Step 7: Run recurrence verification**

Run:

```powershell
npm test -- --runInBand __tests__/recurrenceWindow.test.ts
npm test -- --runInBand __tests__/recurrenceEngine.test.ts __tests__/monthlyRecurrence.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit**

```powershell
git add src __tests__/recurrenceWindow.test.ts
git commit -m "feat: clarify recurring occurrence state"
```

---

### Task 10: Final Verification And Bundle Check

**Files:**
- Modify only if verification reveals failures

- [ ] **Step 1: Run full TypeScript check**

Run:

```powershell
npm run typecheck
```

Expected: PASS.

- [ ] **Step 2: Run full tests**

Run:

```powershell
npm test -- --runInBand
```

Expected: PASS with existing and new test suites.

- [ ] **Step 3: Run iOS Expo export**

Run:

```powershell
npx expo export --platform ios
```

Expected: Metro bundles the iOS entry successfully and writes `dist/`.

- [ ] **Step 4: Manual smoke checklist**

Run:

```powershell
npx expo start
```

Manual checks:

```text
1. Fresh database shows General folder.
2. Add Task defaults to General.
3. Existing task row has Move and Edit.
4. Edit opens prefilled task form and saves changes.
5. Overview row title shows "Folder - Task Name".
6. Overview shows Today, Overdue, and Tomorrow.
7. Upcoming button opens separate Upcoming screen.
8. Row Move opens Bulk Shift instead of silently moving to tomorrow.
9. Folder page Edit toggles multi-select mode.
10. Move Selected opens Bulk Shift.
11. Folder active tasks are ordered by scheduled date.
12. Completed tasks leave the active folder list.
13. Folder Archive shows completed tasks.
14. Archived tasks can be restored to active.
15. Archive groups completed tasks by month.
16. Archive can delete one completed task after confirmation.
17. Archive Edit mode can select and delete multiple completed tasks after confirmation.
18. Archive can delete an entire old month after confirmation.
19. Cascade remains opt-in.
20. Checklist items toggle individually and stay visible.
21. Monthly recurrence appears in the recurrence picker.
22. Monthly recurrence works for 31st -> month end.
23. Keyboard can be dismissed by dragging/tapping outside in forms.
```

- [ ] **Step 5: Commit any verification fixes**

If no fixes were needed, skip this step. If fixes were needed:

```powershell
git add .
git commit -m "chore: verify reschedule edit workflow"
```

---

## Plan Self-Review

Spec coverage:

- Move opens bulk shift window: Task 4.
- Cascade available from row-level move when eligible: Task 4.
- Folder page says Edit and supports multi-select move: Task 4.
- Overview keeps tomorrow visible: Task 6.
- Upcoming remains separate: Task 6.
- Overview task header includes folder context: Task 6.
- Checklist items check independently and remain visible: Task 5.
- Task fields editable after creation: Task 3.
- Edit button next to Move: Task 3.
- General folder prepopulated and default: Task 2.
- Monthly recurrence with month-end fallback: Task 1.
- Recurring completion display and occurrence-window overdue behavior: Task 10.
- Keyboard dismissal and checklist visibility while typing: Task 7.
- Folder active task date ordering: Task 8.
- Completed task Archive and restore flow: Task 8.
- Archive single delete, selected bulk delete, monthly grouping, and month bulk delete: Task 8.

No placeholders remain. All new behavior has either a direct unit test or a manual smoke check where UI interaction is the main risk.
