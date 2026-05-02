import type { RecurrenceType } from "../../lib/types";

export const recurrenceOptions: Array<{ label: string; value: RecurrenceType | "off" }> = [
  { label: "Off", value: "off" },
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Specific days", value: "specific_days" },
];
