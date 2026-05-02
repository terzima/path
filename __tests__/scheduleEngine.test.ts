import { scheduleDrafts } from "../src/features/scheduling/scheduleEngine";
import type { ImportDraftTask } from "../src/features/import/importDraft";

function draft(sequenceIndex: number, title: string): ImportDraftTask {
  return {
    id: title,
    sequenceIndex,
    title,
    description: "",
    scheduledDate: null,
    durationHours: 2,
    defaultedDuration: true,
    energyType: "deep",
    checklistItems: [],
    sequenceGroupId: "rolo",
  };
}

test("maps task sequence to consecutive real dates", () => {
  const scheduled = scheduleDrafts([draft(1, "Task 1"), draft(2, "Task 2"), draft(3, "Task 3")], "2026-05-03");
  expect(scheduled.map((task) => task.scheduledDate)).toEqual(["2026-05-03", "2026-05-04", "2026-05-05"]);
});
