import { chooseDefaultFolderId } from "../src/lib/taskHelpers";
import type { Folder } from "../src/lib/types";

const folders: Folder[] = [
  { id: "rolo", name: "Rolo Dev", colorHex: "#111827", createdAt: "2026-05-02T00:00:00.000Z" },
  { id: "general", name: "General", colorHex: "#3B82F6", createdAt: "2026-05-02T00:00:00.000Z" },
];

test("defaults to General folder when no folder was supplied", () => {
  expect(chooseDefaultFolderId(folders, null)).toBe("general");
});

test("preserves explicit folder selection", () => {
  expect(chooseDefaultFolderId(folders, "rolo")).toBe("rolo");
});
