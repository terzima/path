import type { EnergyType } from "../../lib/types";

export type ImportAction = "upsert" | "delete" | "archive";

export type ImportDraftTask = {
  id: string;
  externalId: string | null;
  order: number | null;
  sourceRow: number;
  action: ImportAction;
  sequenceIndex: number | null;
  title: string;
  description: string;
  explicitDate: string | null;
  scheduledDate: string | null;
  spanDays: number;
  durationHours: number;
  defaultedDuration: boolean;
  energyType: EnergyType;
  checklistItems: string[];
  sequenceGroupId: string | null;
};
