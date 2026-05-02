import { parseCsvToDrafts } from "../src/features/import/csvParser";

jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn(() => "test-id"),
}));

test("parses CSV and defaults missing duration to 2h", () => {
  const drafts = parseCsvToDrafts(`sequence,title,description,duration,energy,checklist
1,Build model,Create tables,3,deep,"Folder;Task"
2,Build overview,,,,`);

  expect(drafts).toHaveLength(2);
  expect(drafts[0].durationHours).toBe(3);
  expect(drafts[0].defaultedDuration).toBe(false);
  expect(drafts[0].checklistItems).toEqual(["Folder", "Task"]);
  expect(drafts[1].durationHours).toBe(2);
  expect(drafts[1].defaultedDuration).toBe(true);
});

test("parses richer csv import controls", () => {
  const drafts = parseCsvToDrafts(`externalId,order,title,description,checklist,duration,energy,sequenceGroupId,date,spanDays,action
rolo-001,2.5,Inserted task,Middle task,Do it,90m,light,backend,2026-05-10,3,
rolo-002,,Remove old task,,,,,,,,delete`);

  expect(drafts[0]).toMatchObject({
    externalId: "rolo-001",
    order: 2.5,
    explicitDate: "2026-05-10",
    spanDays: 3,
    action: "upsert",
    durationHours: 1.5,
    sequenceGroupId: "backend",
  });
  expect(drafts[1]).toMatchObject({
    externalId: "rolo-002",
    action: "delete",
  });
});
