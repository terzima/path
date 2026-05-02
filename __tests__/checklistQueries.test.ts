import { toggleChecklistDoneValue } from "../src/lib/taskHelpers";

test("toggleChecklistDoneValue flips checklist completion", () => {
  expect(toggleChecklistDoneValue(false)).toBe(true);
  expect(toggleChecklistDoneValue(true)).toBe(false);
});
