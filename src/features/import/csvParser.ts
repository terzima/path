import Papa from "papaparse";
import { createId } from "../../lib/id";
import type { EnergyType } from "../../lib/types";
import type { ImportDraftTask } from "./importDraft";

type Row = Record<string, string | undefined>;

export function parseCsvToDrafts(csv: string): ImportDraftTask[] {
  const result = Papa.parse<Row>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  return result.data
    .filter((row) => (row.title ?? "").trim().length > 0)
    .map((row) => {
      const duration = Number(row.duration);
      const hasDuration = Number.isFinite(duration) && duration > 0;
      return {
        id: createId(),
        sequenceIndex: parseOptionalNumber(row.sequence),
        title: row.title!.trim(),
        description: row.description ?? "",
        scheduledDate: null,
        durationHours: hasDuration ? duration : 2,
        defaultedDuration: !hasDuration,
        energyType: parseEnergy(row.energy),
        checklistItems: (row.checklist ?? "")
          .split(";")
          .map((item) => item.trim())
          .filter(Boolean),
        sequenceGroupId: row.sequenceGroupId?.trim() || null,
      };
    });
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
