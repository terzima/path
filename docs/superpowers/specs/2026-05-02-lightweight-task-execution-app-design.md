# Lightweight Task Execution App Design

Date: 2026-05-02

## Purpose

Build a private, lightweight execution tool for a solo builder managing multiple complex projects. The app prioritizes daily clarity, fast schedule adjustment, and reliable import over broad productivity features.

The product is a date-based sequence executor, not a full task management suite. Its core promise is: when a roadmap falls behind, the user can move reality forward without destroying the plan.

## Core Concepts

### Overview

The Overview is the main execution cockpit. It combines work from every folder and shows:

- Overdue tasks
- Today's tasks
- Upcoming tasks
- Recurring blocks due today
- Total estimated hours for the selected day

The Overview supports fast completion, checklist expansion, quick rescheduling, and bulk rescheduling.

### Folders

Folders are the user-facing name for project containers. Internally they can be stored as projects.

Examples:

- Rolo Dev
- Robotics
- Trading Bot
- Personal

Clicking a folder filters the app to that project only. The folder page supports task review, sequence ordering, scheduled dates, CSV import into that folder, manual task creation, and bulk schedule shifts.

### Work Blocks

Tasks represent work blocks, not microtasks. A task should usually represent 1-4 hours of focused work and may contain checklist items.

The app avoids breaking imported plans into tiny time slices. If a task spans multiple days, it should be split into multiple work blocks.

## Minimal Data Model

```ts
type Folder = {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
};

type Task = {
  id: string;
  folderId: string;
  title: string;
  description?: string;
  scheduledDate: string;
  durationHours?: number;
  energyType: "deep" | "light" | "admin";
  sequenceIndex?: number;
  sequenceGroupId?: string;
  status: "todo" | "done" | "skipped";
  checklistItems: ChecklistItem[];
  recurringRule?: RecurringRule;
  createdAt: string;
  updatedAt: string;
};

type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

type RecurringRule = {
  type: "daily" | "weekly" | "specific_days";
  daysOfWeek?: number[];
};

type ScheduleChange = {
  id: string;
  changedAt: string;
  taskIds: string[];
  previousDates: Record<string, string>;
  newDates: Record<string, string>;
  reason: "manual-reschedule" | "cascade-shift";
};
```

This model supports sequence-based scheduling, cascading shifts, multi-folder management, manual tasks, recurring tasks, and undo for the last schedule shift without introducing dependencies, tags, priorities, accounts, or complex recurrence.

## Import Flow

CSV import is the primary reliable path. PDF import may exist later as a convenience, but the MVP should not depend on perfect PDF parsing.

1. User selects or creates a folder.
2. User imports a CSV file.
3. App maps fields:
   - sequence
   - title
   - description
   - duration
   - energy type
   - checklist items
4. User chooses a start date.
5. App converts sequence values into real calendar dates.
   - Sequence 1 maps to the start date.
   - Sequence 2 maps to the next day.
   - Sequence 3 maps to the day after that.
6. App shows a review/edit table before final import.
7. User edits dates, titles, durations, folder, energy type, checklist items, and sequence group if needed.
8. User confirms import.

Tasks without durations import successfully. The app defaults them to 2 hours and marks the duration as defaulted so the user can edit it during review. Missing duration does not block import.

## Manual Add Flow

The app has two obvious manual actions:

- Add Folder
- Add Task

Add Task is available globally and inside each folder. A manually added task supports the same information as imported tasks:

- Title
- Description
- Folder
- Scheduled date
- Duration in hours
- Energy type
- Sequence index
- Checklist items
- Recurring toggle

The recurring toggle supports:

- Off
- Daily
- Weekly
- Specific days

Specific days allows selecting any combination of Monday through Sunday. Complex recurrence rules, end dates, and calendar exceptions are excluded from the MVP.

## Daily Execution Behavior

The Overview should be optimized for speed under pressure.

Each task row shows:

- Completion checkbox
- Folder chip
- Title
- Duration
- Energy type
- Scheduled date
- Checklist expand control
- Quick reschedule control

The app allows multiple tasks on one day. It does not attempt strict capacity planning in the MVP. It shows total estimated hours so the user can judge whether the day is realistic.

Recurring tasks behave as templates that produce due instances in the Overview. Completing today's recurring instance does not delete the recurring template.

## Falling Behind And Cascading Shifts

Bulk rescheduling is critical.

The user can select one or more tasks and choose:

- Move selected tasks forward or backward by X days
- Move selected tasks to an exact date
- Optionally cascade future tasks in the same sequence

Cascading is a reschedule mode, not a permanent folder setting. The default behavior is to move selected tasks only.

When cascade is enabled:

1. App identifies the selected tasks' folder and sequence group.
2. App shifts the selected tasks by the requested amount.
3. App finds later tasks in the same folder and sequence group.
4. App shifts later tasks with sequence indexes greater than the selected sequence point by the same amount.
5. App does not affect other folders, unrelated sequence groups, or recurring templates.

Before applying a cascade shift, the app shows a confirmation such as:

"This will move 2 selected tasks and 14 future Rolo Dev tasks forward by 2 days."

The app records the change in `ScheduleChange` so the user can undo the last schedule shift.

## Handling Edge Cases

### Tasks Without Durations

Allow import and manual creation. Display duration as unset or default to 2 hours. Missing duration is not an error.

### Tasks Spanning Multiple Days

Do not support true multi-day tasks in the MVP. Split them into multiple work blocks instead.

### User Shifts Only Part Of A Sequence

Move only selected tasks by default. If cascade is enabled, shift future tasks in the same folder and sequence group by the same amount.

### Stacking Tasks On One Day

Allow it. The app shows total hours but does not prevent stacking.

## Minimum UI

### Left Sidebar

- Overview
- Folder list
- Add Folder button

### Overview Page

- Overdue section
- Today section
- Upcoming section
- Total estimated hours
- Add Task button
- Import CSV button
- Bulk Reschedule button

### Folder Page

- Folder-specific task list
- Sequence indexes and scheduled dates
- Add Task button
- Import CSV into this folder
- Bulk shift with optional cascade

### Task Form

- Title
- Description
- Folder
- Date
- Duration
- Energy type
- Checklist items
- Sequence index
- Recurring toggle
- Recurrence picker

## MVP Feature Set

- Local single-user app
- Folder CRUD
- Task CRUD
- Manual Add Folder
- Manual Add Task
- CSV import
- Import review/edit table
- Overview execution view
- Folder-specific view
- Checklist expansion
- Mark complete
- Quick reschedule
- Bulk move by X days
- Optional cascade shift
- Undo last schedule shift
- Daily, weekly, and specific-day recurring tasks

## Explicitly Excluded

- Accounts
- Sync
- Collaboration
- Notifications
- AI planning agent
- Calendar integration
- Drag-and-drop calendar
- Dependency graph
- Minute-level time blocking
- Priority scoring
- Analytics dashboards
- Complex recurrence rules
- Perfect PDF parsing
- Nested folders
- Separate goals system
- Tags and contexts

## Fastest Path To MVP

### Day 1

Build the local data model, folder/task CRUD, and Overview page.

### Day 2

Build CSV import and the review/edit table.

### Day 3

Build bulk reschedule, optional cascade shift, and undo last shift.

### Day 4

Add recurring tasks and folder-specific views.

### Day 5

Use the app on a real Rolo plan and fix only the friction that appears in real usage.

## Success Criteria

The MVP succeeds if the user can:

- Import a structured plan from CSV.
- Convert sequence numbers into real dates.
- See all work due today across folders.
- Drill into a single folder.
- Manually add folders and tasks.
- Add recurring daily, weekly, or specific-day tasks.
- Move selected tasks when behind.
- Optionally cascade future tasks in the same sequence.
- Undo the last schedule shift.

The MVP should feel fast enough to use while under pressure and simple enough that maintaining the system never becomes its own project.
