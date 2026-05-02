# Display Refresh Bugfixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix uncapped task descriptions, Main sequence group label leakage, durable folder deletion, and edited-task visibility refresh.

**Architecture:** Keep the SQLite schema intact. Centralize sequence group display/input helpers, harden delete helpers in `queries.ts`, and make overview use a single active/due filter that matches the intended Today/Overdue/Tomorrow behavior.

**Tech Stack:** Expo Router, React Native, TypeScript, Expo SQLite, Jest.

---

## File Structure

- Modify `src/components/TaskRow.tsx`: remove capped description rows.
- Modify `src/lib/sequenceGroups.ts`: add helpers for UI input/display conversion.
- Modify `src/features/tasks/TaskForm.tsx`: never show raw folder IDs in sequence group input/chips; save `Main` or blank as the selected folder ID.
- Modify `src/lib/db/queries.ts`: make deletes explicit and transactional enough for folder/task cleanup.
- Modify `src/features/folders/FolderListScreen.tsx`: block General deletion and refresh after delete.
- Modify `src/features/overview/useOverview.ts`: filter out deleted-folder tasks and ensure edited dated tasks land in the correct overview bucket.
- Add/modify sequence group tests.

---

### Task 1: Uncap Task Descriptions

**Files:**
- Modify: `src/components/TaskRow.tsx`

- [ ] Remove `numberOfLines={2}` from the task description `Text`.

### Task 2: Main Sequence Group Display

**Files:**
- Modify: `src/lib/sequenceGroups.ts`
- Modify: `src/features/tasks/TaskForm.tsx`
- Modify: `__tests__/sequenceGroupActions.test.ts`

- [ ] Add helpers:
  - `sequenceGroupInputValue(sequenceGroupId, folderId)` returns `"Main"` for folder default and custom text for custom groups.
  - `sequenceGroupValueFromInput(input, folderId)` maps blank or `"Main"` to `folderId`; custom text stays custom.
- [ ] Use those helpers when loading/saving the task form.
- [ ] Ensure existing sequence group chips display `Main` for the folder-backed group.
- [ ] Add tests for the helpers.

### Task 3: Durable Delete Behavior

**Files:**
- Modify: `src/lib/db/queries.ts`
- Modify: `src/features/folders/FolderListScreen.tsx`

- [ ] Update `deleteTasks` to explicitly delete checklist items and recurring completions before deleting task rows.
- [ ] Update `deleteFolder` to collect every task in the folder, delete those tasks, and then delete the folder.
- [ ] Block deleting the `general` folder in UI because migration reseeds it.

### Task 4: Edited Task Visibility

**Files:**
- Modify: `src/features/overview/useOverview.ts`
- Modify: `src/features/tasks/TaskForm.tsx`

- [ ] Make overview ignore tasks whose `folderId` no longer exists.
- [ ] Keep overview scoped to Today, Overdue, and Tomorrow.
- [ ] Ensure saving an edit updates task fields and checklist before navigation.

### Task 5: Verification

**Files:**
- No additional files.

- [ ] Run `npm run typecheck`.
- [ ] Run `npm test -- --runInBand`.
- [ ] Run `npx expo export --platform ios`.
- [ ] Commit, merge to main, verify on main, push.
