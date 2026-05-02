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
