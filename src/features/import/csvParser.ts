import Papa from "papaparse";
import { createId } from "../../lib/id";
import { parseDurationText } from "../../lib/duration";
import type { EnergyType } from "../../lib/types";
import type { ImportAction, ImportDraftTask } from "./importDraft";

type Row = Record<string, string | undefined>;

export function parseCsvToDrafts(csv: string): ImportDraftTask[] {
  const result = Papa.parse<Row>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  return result.data
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => (row.title ?? row.externalId ?? "").trim().length > 0)
    .map(({ row, index }) => {
      const duration = parseDurationText(row.duration);
      return {
        id: createId(),
        externalId: row.externalId?.trim() || null,
        order: parseOptionalNumber(row.order ?? row.sequence),
        sourceRow: index,
        action: parseAction(row.action),
        sequenceIndex: null,
        title: row.title?.trim() || "(Untitled task)",
        description: row.description ?? "",
        explicitDate: row.date?.trim() || null,
        scheduledDate: null,
        spanDays: parseSpanDays(row.spanDays),
        durationHours: duration.durationHours,
        defaultedDuration: duration.defaultedDuration,
        energyType: parseEnergy(row.energy),
        checklistItems: (row.checklist ?? "")
          .split(";")
          .map((item) => item.trim())
          .filter(Boolean),
        sequenceGroupId: row.sequenceGroupId?.trim() || null,
      };
    });
}

function parseSpanDays(value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.floor(parsed);
}

function parseAction(value: string | undefined): ImportAction {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "delete") return "delete";
  if (normalized === "archive") return "archive";
  return "upsert";
}

function parseOptionalNumber(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseEnergy(value: string | undefined): EnergyType {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "light" || normalized === "admin" || normalized === "deep") return normalized;
  return "deep";
}
