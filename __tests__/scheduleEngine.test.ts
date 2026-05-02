import { scheduleDrafts } from "../src/features/scheduling/scheduleEngine";
import type { ImportDraftTask } from "../src/features/import/importDraft";

function draft(order: number, title: string, patch: Partial<ImportDraftTask> = {}): ImportDraftTask {
  return {
    id: title,
    externalId: null,
    order,
    sourceRow: order,
    action: "upsert",
    sequenceIndex: null,
    title,
    description: "",
    explicitDate: null,
    scheduledDate: null,
    spanDays: 1,
    durationHours: 2,
    defaultedDuration: true,
    energyType: "deep",
    checklistItems: [],
    sequenceGroupId: "rolo",
    ...patch,
  };
}

test("maps task sequence to consecutive real dates", () => {
  const scheduled = scheduleDrafts([draft(1, "Task 1"), draft(2, "Task 2"), draft(3, "Task 3")], "2026-05-03");
  expect(scheduled.map((task) => task.scheduledDate)).toEqual(["2026-05-03", "2026-05-04", "2026-05-05"]);
});

test("normalizes sequence indexes per sequence group", () => {
  const scheduled = scheduleDrafts([
    draft(1, "Main A", { sequenceGroupId: null }),
    draft(8, "Backend A", { sequenceGroupId: "backend" }),
    draft(9, "Backend B", { sequenceGroupId: "backend" }),
  ], "2026-05-03");

  expect(scheduled.map((task) => [task.title, task.sequenceGroupId, task.sequenceIndex])).toEqual([
    ["Main A", null, 1],
    ["Backend A", "backend", 1],
    ["Backend B", "backend", 2],
  ]);
});

test("expands span days and consumes sequence slots", () => {
  const scheduled = scheduleDrafts([
    draft(1, "Build auth", { spanDays: 3, externalId: "auth-build" }),
    draft(2, "Review auth"),
  ], "2026-05-03");

  expect(scheduled.map((task) => [task.title, task.sequenceIndex, task.scheduledDate, task.externalId])).toEqual([
    ["Build auth", 1, "2026-05-03", "auth-build-day-1"],
    ["Build auth", 2, "2026-05-04", "auth-build-day-2"],
    ["Build auth", 3, "2026-05-05", "auth-build-day-3"],
    ["Review auth", 4, "2026-05-06", null],
  ]);
});

test("explicit date anchors later blank dates in the same group", () => {
  const scheduled = scheduleDrafts([
    draft(1, "Launch prep", { explicitDate: "2026-05-10" }),
    draft(2, "Cleanup"),
  ], "2026-05-03");

  expect(scheduled.map((task) => task.scheduledDate)).toEqual(["2026-05-10", "2026-05-11"]);
});
