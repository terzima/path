# Task Polish Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix task form ordering and hydration, add overview delete, and prevent list bottoms from being clipped.

**Architecture:** Keep the existing React Native screens and SQLite helpers. Changes are UI wiring only except for safer task form state hydration, using the existing `deleteTask`, `getTask`, and checklist query helpers.

**Tech Stack:** Expo Router, React Native, TypeScript, Expo SQLite, Jest.

---

## File Structure

- Modify `src/features/tasks/TaskForm.tsx`: move checklist below description, reset/hydrate state reliably when editing, and increase bottom padding.
- Modify `src/features/overview/OverviewScreen.tsx`: add delete confirmation and pass `onDelete` into `TaskRow`.
- Modify `src/features/folders/FolderDetailScreen.tsx`, `src/features/folders/FolderArchiveScreen.tsx`, `src/features/folders/FolderListScreen.tsx`, `src/features/upcoming/UpcomingScreen.tsx`, `src/features/scheduling/BulkShiftScreen.tsx`: add consistent `contentContainerStyle` bottom padding to scroll views that can clip bottom content.
- Verify with TypeScript, Jest, and iOS export.

---

### Task 1: Task Form Ordering And Hydration

**Files:**
- Modify: `src/features/tasks/TaskForm.tsx`

- [ ] **Step 1: Reset form state before each load**

Set `loaded` to false at the start of the load effect and initialize local defaults before hydrating a fetched task.

- [ ] **Step 2: Hydrate edit state from the fetched task**

Keep the existing `getTask(taskId)` path, but make sure each field is assigned from the fetched task and the checklist is loaded from `listChecklistItems(task.id)` during the same load.

- [ ] **Step 3: Move checklist below description**

Render `<ChecklistEditor items={checklistItems} onChange={setChecklistItems} />` immediately after the Description field.

- [ ] **Step 4: Increase task form bottom padding**

Use `paddingBottom: 160` in the task form `ScrollView` content container.

### Task 2: Overview Delete

**Files:**
- Modify: `src/features/overview/OverviewScreen.tsx`

- [ ] **Step 1: Import `Alert` and `deleteTask`**

Use the existing delete helper from `src/lib/db/queries.ts`.

- [ ] **Step 2: Add confirm delete function**

Confirmation title: `Delete "<task title>"?`

Confirmation body: `This cannot be undone.`

- [ ] **Step 3: Pass delete action to task rows**

Pass `onDelete={() => confirmDeleteTask(task)}` in the overview row builder.

### Task 3: Bottom Padding

**Files:**
- Modify: `src/features/overview/OverviewScreen.tsx`
- Modify: `src/features/folders/FolderDetailScreen.tsx`
- Modify: `src/features/folders/FolderArchiveScreen.tsx`
- Modify: `src/features/folders/FolderListScreen.tsx`
- Modify: `src/features/upcoming/UpcomingScreen.tsx`
- Modify: `src/features/scheduling/BulkShiftScreen.tsx`

- [ ] **Step 1: Add bottom padding to task list scroll views**

For scroll views without a `contentContainerStyle`, add `contentContainerStyle={{ paddingBottom: 140 }}`.

- [ ] **Step 2: Preserve existing spacing**

For scroll views with existing `contentContainerStyle`, keep their existing values and increase bottom padding to at least `140`.

### Task 4: Verification And Delivery

**Files:**
- No additional files.

- [ ] **Step 1: Run typecheck**

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 2: Run tests**

Run: `npm test -- --runInBand`

Expected: PASS.

- [ ] **Step 3: Run iOS export**

Run: `npx expo export --platform ios`

Expected: PASS with `Exported: dist`.

- [ ] **Step 4: Commit, merge, push**

Commit on the feature branch, merge into `main`, verify again if needed, then push `origin main`.
