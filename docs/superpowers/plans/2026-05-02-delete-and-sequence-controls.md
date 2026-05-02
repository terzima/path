# Delete And Sequence Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add safe folder/task deletion plus sequence group labels, filters, and deletion choices.

**Architecture:** Keep the existing SQLite task model unchanged. Add small helper functions for sequence group display/action semantics, extend query helpers for destructive operations, and wire the UI through existing `Alert` confirmations and folder/task screens.

**Tech Stack:** Expo Router, React Native, TypeScript, Expo SQLite, Jest.

---

## File Structure

- Modify `src/lib/sequenceGroups.ts`: new focused helper for displaying `Main`, filtering group membership, and identifying non-deletable default groups.
- Modify `src/lib/db/queries.ts`: add folder delete, task delete cleanup, sequence group move-to-main, and sequence group task delete helpers.
- Modify `src/components/TaskRow.tsx`: add optional `onDelete` action below Edit.
- Modify `src/features/folders/FolderListScreen.tsx`: add folder delete action with confirmation.
- Modify `src/features/folders/FolderDetailScreen.tsx`: add sequence group filter buttons, sequence group deletion actions, and task delete confirmation.
- Modify `src/features/overview/OverviewScreen.tsx`, `src/features/upcoming/UpcomingScreen.tsx`, `src/features/folders/FolderArchiveScreen.tsx`: pass friendly sequence labels.
- Modify `src/features/tasks/TaskForm.tsx`: show `Main` for folder-default sequence chips while saving the same underlying value.
- Test `__tests__/sequenceGroupActions.test.ts`: cover helper behavior for `Main`, custom filters, move-to-main patch shape, and deletable group rules.

---

### Task 1: Sequence Group Helper

**Files:**
- Create: `src/lib/sequenceGroups.ts`
- Test: `__tests__/sequenceGroupActions.test.ts`

- [ ] **Step 1: Write helper tests**

```ts
import {
  canDeleteSequenceGroup,
  displaySequenceGroupName,
  isTaskInSequenceGroup,
  normalizeSequenceGroupAfterMoveToMain,
} from "../src/lib/sequenceGroups";
import type { Task } from "../src/lib/types";

function task(sequenceGroupId: string | null, sequenceIndex: number | null = 4): Task {
  return {
    id: "task-1",
    folderId: "rolo",
    title: "Task",
    description: "",
    scheduledDate: "2026-05-03",
    durationHours: 2,
    defaultedDuration: false,
    energyType: "deep",
    sequenceIndex,
    sequenceGroupId,
    status: "todo",
    recurrenceType: null,
    recurrenceDaysOfWeek: [],
    createdAt: "2026-05-03T00:00:00.000Z",
    updatedAt: "2026-05-03T00:00:00.000Z",
  };
}

test("folder default sequence group displays as Main", () => {
  expect(displaySequenceGroupName("rolo", "rolo")).toBe("Main");
});

test("custom sequence group displays its typed label", () => {
  expect(displaySequenceGroupName("backend", "rolo")).toBe("backend");
});

test("main group includes folder-backed and blank tasks", () => {
  expect(isTaskInSequenceGroup(task("rolo"), "rolo", "rolo")).toBe(true);
  expect(isTaskInSequenceGroup(task(null), "rolo", "rolo")).toBe(true);
  expect(isTaskInSequenceGroup(task("backend"), "rolo", "rolo")).toBe(false);
});

test("custom group only includes exact custom group", () => {
  expect(isTaskInSequenceGroup(task("backend"), "backend", "rolo")).toBe(true);
  expect(isTaskInSequenceGroup(task("frontend"), "backend", "rolo")).toBe(false);
});

test("moving a deleted group to main removes sequence index", () => {
  expect(normalizeSequenceGroupAfterMoveToMain(task("backend"), "rolo")).toMatchObject({
    sequenceGroupId: "rolo",
    sequenceIndex: null,
  });
});

test("main cannot be deleted and custom groups can", () => {
  expect(canDeleteSequenceGroup("rolo", "rolo")).toBe(false);
  expect(canDeleteSequenceGroup("backend", "rolo")).toBe(true);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --runInBand __tests__/sequenceGroupActions.test.ts`

Expected: FAIL because `src/lib/sequenceGroups.ts` does not exist.

- [ ] **Step 3: Implement sequence helper**

```ts
import type { Task } from "./types";

export function displaySequenceGroupName(sequenceGroupId: string | null | undefined, folderId: string | null | undefined): string {
  if (!sequenceGroupId || sequenceGroupId === folderId) return "Main";
  return sequenceGroupId;
}

export function isTaskInSequenceGroup(task: Task, sequenceGroupId: string, folderId: string): boolean {
  if (sequenceGroupId === folderId) return !task.sequenceGroupId || task.sequenceGroupId === folderId;
  return task.sequenceGroupId === sequenceGroupId;
}

export function normalizeSequenceGroupAfterMoveToMain(task: Task, folderId: string): Task {
  return {
    ...task,
    sequenceGroupId: folderId,
    sequenceIndex: null,
  };
}

export function canDeleteSequenceGroup(sequenceGroupId: string, folderId: string): boolean {
  return sequenceGroupId !== folderId;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- --runInBand __tests__/sequenceGroupActions.test.ts`

Expected: PASS.

### Task 2: Query Helpers

**Files:**
- Modify: `src/lib/db/queries.ts`

- [ ] **Step 1: Add destructive query helpers**

Add:

```ts
export async function deleteFolder(folderId: string): Promise<void> {
  const db = await getDatabase();
  const tasks = await db.getAllAsync<TaskRow>("SELECT * FROM tasks WHERE folder_id = ?", folderId);
  for (const task of tasks) await deleteTask(task.id);
  await db.runAsync("DELETE FROM folders WHERE id = ?", folderId);
}

export async function deleteTasksInSequenceGroup(folderId: string, sequenceGroupId: string): Promise<number> {
  const tasks = await listTasksInSequenceGroup(folderId, sequenceGroupId);
  await deleteTasks(tasks.map((task) => task.id));
  return tasks.length;
}

export async function moveSequenceGroupTasksToMain(folderId: string, sequenceGroupId: string): Promise<number> {
  const db = await getDatabase();
  const tasks = await listTasksInSequenceGroup(folderId, sequenceGroupId);
  for (const task of tasks) {
    await db.runAsync(
      "UPDATE tasks SET sequence_group_id = ?, sequence_index = NULL, updated_at = ? WHERE id = ?",
      folderId,
      new Date().toISOString(),
      task.id,
    );
  }
  return tasks.length;
}

export async function listTasksInSequenceGroup(folderId: string, sequenceGroupId: string): Promise<Task[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TaskRow>(
    `SELECT * FROM tasks
     WHERE folder_id = ?
       AND (
         (? = ? AND (sequence_group_id IS NULL OR sequence_group_id = ?))
         OR (? != ? AND sequence_group_id = ?)
       )
     ORDER BY scheduled_date ASC, sequence_index ASC, created_at ASC`,
    folderId,
    sequenceGroupId,
    folderId,
    folderId,
    sequenceGroupId,
    folderId,
    sequenceGroupId,
  );
  return rows.map(rowToTask);
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`

Expected: PASS.

### Task 3: Folder And Task Delete UI

**Files:**
- Modify: `src/components/TaskRow.tsx`
- Modify: `src/features/folders/FolderListScreen.tsx`
- Modify: `src/features/folders/FolderDetailScreen.tsx`

- [ ] **Step 1: Add delete action to task row**

Add optional `onDelete?: () => void` prop and render a red `Delete` text button below Edit.

- [ ] **Step 2: Add folder delete confirmation**

In `FolderListScreen`, import `Alert` and `deleteFolder`. Render a delete button per row. Confirmation text must say the folder and all tasks will be permanently deleted.

- [ ] **Step 3: Add active task delete confirmation**

In `FolderDetailScreen`, import `Alert` and `deleteTask`. Pass `onDelete` to `TaskRow`. Confirmation text must say the task cannot be undone.

- [ ] **Step 4: Verify typecheck**

Run: `npm run typecheck`

Expected: PASS.

### Task 4: Sequence Group Filters And Delete Choices

**Files:**
- Modify: `src/features/folders/FolderDetailScreen.tsx`
- Modify: `src/features/tasks/TaskForm.tsx`
- Modify: `src/features/overview/OverviewScreen.tsx`
- Modify: `src/features/upcoming/UpcomingScreen.tsx`
- Modify: `src/features/folders/FolderArchiveScreen.tsx`

- [ ] **Step 1: Add sequence group filters**

In `FolderDetailScreen`, derive sequence group ids from loaded tasks, include the folder id as `Main`, and add filter chips `All`, `Main`, plus custom groups. Filter visible tasks without changing the database.

- [ ] **Step 2: Add sequence group delete choices**

For custom groups only, add a `Delete` action next to the active sequence group chip. The `Alert` must offer:
- `Move Tasks to Main`, calls `moveSequenceGroupTasksToMain(folderId, groupId)`
- `Delete Group and Tasks`, calls `deleteTasksInSequenceGroup(folderId, groupId)`
- `Cancel`

- [ ] **Step 3: Friendly sequence labels everywhere**

Use `displaySequenceGroupName(groupId, folderId)` in row metadata and task form chips, so folder default displays as `Main`.

- [ ] **Step 4: Verify typecheck**

Run: `npm run typecheck`

Expected: PASS.

### Task 5: Full Verification And Merge

**Files:**
- No code files beyond previous tasks.

- [ ] **Step 1: Run tests**

Run: `npm test -- --runInBand`

Expected: PASS.

- [ ] **Step 2: Run iOS export**

Run: `npx expo export --platform ios`

Expected: PASS and `Exported: dist`.

- [ ] **Step 3: Commit, merge, push**

Commit the implementation on the feature branch, merge into `main`, verify again on `main`, then push `origin main`.
