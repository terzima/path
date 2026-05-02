import { addDays } from "../../lib/dates";
import type { ImportDraftTask } from "../import/importDraft";

export function scheduleDrafts(drafts: ImportDraftTask[], startDate: string): ImportDraftTask[] {
  return [...drafts]
    .sort((a, b) => {
      const sequence = (a.sequenceIndex ?? 999_999) - (b.sequenceIndex ?? 999_999);
      return sequence === 0 ? a.title.localeCompare(b.title) : sequence;
    })
    .map((draft, index) => ({
      ...draft,
      scheduledDate: addDays(startDate, index),
    }));
}
