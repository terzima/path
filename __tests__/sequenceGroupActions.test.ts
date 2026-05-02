import {
  canDeleteSequenceGroup,
  displaySequenceGroupName,
  isTaskInSequenceGroup,
  normalizeSequenceGroupAfterMoveToMain,
  sequenceGroupInputValue,
  sequenceGroupValueFromInput,
} from "../src/lib/sequenceGroups";
import type { Task } from "../src/lib/types";

function task(sequenceGroupId: string | null, sequenceIndex: number | null = 4): Task {
  return {
    id: "task-1",
    externalId: null,
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

test("sequence group input shows Main for folder default", () => {
  expect(sequenceGroupInputValue("rolo", "rolo")).toBe("Main");
  expect(sequenceGroupInputValue(null, "rolo")).toBe("Main");
});

test("sequence group input save maps Main or blank to folder id", () => {
  expect(sequenceGroupValueFromInput("Main", "rolo")).toBe("rolo");
  expect(sequenceGroupValueFromInput("", "rolo")).toBe("rolo");
  expect(sequenceGroupValueFromInput("backend", "rolo")).toBe("backend");
});
