import { chooseSequenceGroup, uniqueSequenceGroups } from "../src/lib/taskHelpers";
import type { Task } from "../src/lib/types";

function task(sequenceGroupId: string | null): Task {
  return {
    id: sequenceGroupId ?? "empty",
    externalId: null,
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
