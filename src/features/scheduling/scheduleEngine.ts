import { addDays } from "../../lib/dates";
import { createId } from "../../lib/id";
import type { ImportDraftTask } from "../import/importDraft";

const MAIN_GROUP_KEY = "__main__";

export function scheduleDrafts(drafts: ImportDraftTask[], startDate: string): ImportDraftTask[] {
  const actionDrafts = drafts
    .filter((draft) => draft.action !== "upsert")
    .map((draft) => ({
      ...draft,
      sequenceIndex: null,
      scheduledDate: draft.explicitDate,
    }));

  const upsertDrafts = drafts.filter((draft) => draft.action === "upsert");
  const groups = groupDrafts(upsertDrafts);
  const scheduledGroups = Array.from(groups.values()).flatMap((groupDrafts) => scheduleGroup(groupDrafts, startDate));

  return [...scheduledGroups, ...actionDrafts].sort((a, b) => a.sourceRow - b.sourceRow);
}

function groupDrafts(drafts: ImportDraftTask[]): Map<string, ImportDraftTask[]> {
  const groups = new Map<string, ImportDraftTask[]>();
  for (const draft of drafts) {
    const groupKey = draft.sequenceGroupId ?? MAIN_GROUP_KEY;
    groups.set(groupKey, [...(groups.get(groupKey) ?? []), draft]);
  }
  return groups;
}

function scheduleGroup(drafts: ImportDraftTask[], startDate: string): ImportDraftTask[] {
  const sorted = [...drafts].sort((a, b) => {
    const left = a.order ?? a.sourceRow;
    const right = b.order ?? b.sourceRow;
    const order = left - right;
    return order === 0 ? a.sourceRow - b.sourceRow : order;
  });

  let nextDate = startDate;
  let nextSequence = 1;
  const scheduled: ImportDraftTask[] = [];

  for (const draft of sorted) {
    const spanDays = Math.max(1, draft.spanDays);
    const firstDate = draft.explicitDate ?? nextDate;
    for (let day = 0; day < spanDays; day += 1) {
      const scheduledDate = addDays(firstDate, day);
      scheduled.push({
        ...draft,
        id: day === 0 ? draft.id : createId(),
        externalId: expandedExternalId(draft.externalId, spanDays, day),
        sequenceIndex: nextSequence,
        scheduledDate,
        spanDays: 1,
      });
      nextSequence += 1;
      nextDate = addDays(scheduledDate, 1);
    }
  }

  return scheduled;
}

function expandedExternalId(externalId: string | null, spanDays: number, day: number): string | null {
  if (!externalId || spanDays === 1) return externalId;
  return `${externalId}-day-${day + 1}`;
}
