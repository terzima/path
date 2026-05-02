import { shiftTasks } from "../src/features/scheduling/cascadeShift";
import type { Task } from "../src/lib/types";

function task(id: string, sequenceIndex: number, group = "rolo"): Task {
  return {
    id,
    externalId: null,
    folderId: "folder-1",
    title: id,
    description: "",
    scheduledDate: `2026-05-${String(sequenceIndex).padStart(2, "0")}`,
    durationHours: 2,
    defaultedDuration: false,
    energyType: "deep",
    sequenceIndex,
    sequenceGroupId: group,
    status: "todo",
    recurrenceType: null,
    recurrenceDaysOfWeek: [],
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z",
  };
}

test("selected-only shift leaves later tasks alone", () => {
  const result = shiftTasks({
    tasks: [task("5", 5), task("6", 6)],
    selectedTaskIds: ["5"],
    dayDelta: 2,
    cascade: false,
  });

  expect(result.tasks.find((item) => item.id === "5")?.scheduledDate).toBe("2026-05-07");
  expect(result.tasks.find((item) => item.id === "6")?.scheduledDate).toBe("2026-05-06");
});

test("cascade shifts selected and later tasks in same folder and sequence group", () => {
  const result = shiftTasks({
    tasks: [task("5", 5), task("6", 6), task("other", 7, "other")],
    selectedTaskIds: ["5"],
    dayDelta: 2,
    cascade: true,
  });

  expect(result.tasks.find((item) => item.id === "5")?.scheduledDate).toBe("2026-05-07");
  expect(result.tasks.find((item) => item.id === "6")?.scheduledDate).toBe("2026-05-08");
  expect(result.tasks.find((item) => item.id === "other")?.scheduledDate).toBe("2026-05-07");
});
