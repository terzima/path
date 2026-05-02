import type { EnergyType } from "../../lib/types";

export type ImportDraftTask = {
  id: string;
  sequenceIndex: number | null;
  title: string;
  description: string;
  scheduledDate: string | null;
  durationHours: number;
  defaultedDuration: boolean;
  energyType: EnergyType;
  checklistItems: string[];
  sequenceGroupId: string | null;
};
