# CSV Reimport Rules Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make CSV import support sheet-order sequencing, per-group sequence normalization, multi-day expansion, explicit dates, and externalId-driven create/update/delete/archive.

**Architecture:** Keep tasks as normal task rows. Add nullable `externalId` persistence, parse richer CSV draft fields, expand/schedule drafts before review, then save by action: create/update/delete/archive.

**Tech Stack:** Expo Router, React Native, TypeScript, Expo SQLite, Jest, PapaParse.

---

## File Structure

- Modify `src/lib/types.ts`: add `externalId` to `Task`.
- Modify `src/lib/db/migrations.ts`: add `external_id` column and index if missing.
- Modify `src/lib/db/queries.ts`: read/write `external_id`, add lookup by externalId.
- Modify `src/features/import/importDraft.ts`: add CSV metadata fields.
- Modify `src/features/import/csvParser.ts`: support `externalId`, `order`, legacy `sequence`, `date`, `spanDays`, `action`, and checklist-after-description headers.
- Modify `src/features/scheduling/scheduleEngine.ts`: group by sequenceGroupId, sort by sheet order, expand `spanDays`, normalize final sequence indexes per group, and resolve dates per group.
- Modify `src/features/import/ImportReviewScreen.tsx`: create/update/delete/archive based on action and externalId.
- Modify `docs/csv-template.csv` and `docs/csv-seeded-template.csv`: use the approved future header.
- Add tests for parser and scheduler behavior.

---

### Task 1: Persist externalId

- Add `externalId: string | null` to `Task`.
- Add `external_id` migration and index.
- Include external_id in insert/update/read paths.
- Add `getTaskByExternalId(externalId)`.

### Task 2: Parse richer CSV fields

- Support header:
  `externalId,order,title,description,checklist,duration,energy,sequenceGroupId,date,spanDays,action`
- Keep legacy `sequence` as fallback for `order`.
- Parse action as blank/delete/archive.
- Parse spanDays as positive integer, default 1.

### Task 3: Resolve order, sequence, dates, and spans

- Group drafts by sequenceGroupId.
- Sort by numeric order, preserving CSV row order for ties/missing order.
- Expand each row by `spanDays`.
- Assign final sequence indexes per group after expansion.
- Resolve dates per group:
  - explicit `date` anchors that expanded row
  - blank dates continue one day after the previous item in that group
  - groups without explicit dates start from import review start date

### Task 4: Save create/update/delete/archive

- Blank action:
  - externalId exists and matching task exists -> update
  - otherwise create
- delete:
  - requires externalId
  - delete matching task if found
- archive:
  - requires externalId
  - mark matching task done if found
- Do not auto-delete missing rows.

### Task 5: Templates and verification

- Update CSV templates with the new header and examples.
- Run `npm run typecheck`.
- Run `npm test -- --runInBand`.
- Run `npx expo export --platform ios`.
- Commit, merge to main, verify on main, push.
