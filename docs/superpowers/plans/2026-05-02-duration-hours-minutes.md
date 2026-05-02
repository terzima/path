# Duration Hours Minutes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users enter and view task duration as hours, minutes, or a combination while keeping decimal hours internally.

**Architecture:** Add a small duration utility module that converts between display/input values and stored decimal hours. Use it in manual task forms, import review, CSV parsing, and task row metadata.

**Tech Stack:** Expo Router, React Native, TypeScript, Jest, PapaParse.

---

## File Structure

- Create `src/lib/duration.ts`: conversion, formatting, and CSV parsing helpers.
- Add `__tests__/duration.test.ts`: unit coverage for friendly formatting, hour/minute splitting, normalization, and CSV duration parsing.
- Modify `src/features/tasks/TaskForm.tsx`: replace single decimal-hours input with Hours and Minutes inputs in one Duration section.
- Modify `src/components/TaskRow.tsx`: show friendly duration like `1h 30m`.
- Modify `src/features/import/csvParser.ts`: parse `2`, `1.5h`, `90m`, `1h 30m`, blank/invalid.
- Modify `src/features/import/ImportReviewScreen.tsx`: show/edit duration as Hours and Minutes.

---

### Task 1: Duration Utility

**Files:**
- Create `src/lib/duration.ts`
- Create `__tests__/duration.test.ts`

- [ ] Implement helpers:
  - `splitDurationHours(durationHours)` -> `{ hours: string, minutes: string }`
  - `durationInputsToHours(hoursInput, minutesInput)` -> `{ durationHours, defaultedDuration }`
  - `formatDuration(durationHours)` -> `20m`, `1h`, `1h 30m`
  - `parseDurationText(value)` -> same result shape, supporting hours/minutes text.

### Task 2: Manual Task Form

**Files:**
- Modify `src/features/tasks/TaskForm.tsx`

- [ ] Replace `durationHours` state with `durationHourInput` and `durationMinuteInput`.
- [ ] Hydrate edit state with `splitDurationHours(task.durationHours)`.
- [ ] Save with `durationInputsToHours(...)`.
- [ ] Render a single Duration section with two side-by-side inputs: Hours and Minutes.

### Task 3: Display And Import

**Files:**
- Modify `src/components/TaskRow.tsx`
- Modify `src/features/import/csvParser.ts`
- Modify `src/features/import/ImportReviewScreen.tsx`

- [ ] Replace raw `${task.durationHours}h` with `formatDuration(task.durationHours)`.
- [ ] Parse CSV duration with `parseDurationText`.
- [ ] Let import review edit duration with Hours and Minutes fields.

### Task 4: Verification And Delivery

**Files:**
- No additional files.

- [ ] Run `npm run typecheck`.
- [ ] Run `npm test -- --runInBand`.
- [ ] Run `npx expo export --platform ios`.
- [ ] Commit, merge to main, verify on main, push.
