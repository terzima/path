export type DurationParseResult = {
  durationHours: number;
  defaultedDuration: boolean;
};

const DEFAULT_DURATION_HOURS = 2;

export function splitDurationHours(durationHours: number): { hours: string; minutes: string } {
  const totalMinutes = Math.max(0, Math.round(durationHours * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return {
    hours: hours > 0 ? String(hours) : "",
    minutes: minutes > 0 ? String(minutes) : "",
  };
}

export function durationInputsToHours(hoursInput: string, minutesInput: string): DurationParseResult {
  const hours = parsePositiveNumber(hoursInput);
  const minutes = parsePositiveNumber(minutesInput);
  const totalMinutes = Math.round(hours * 60 + minutes);
  if (totalMinutes <= 0) return { durationHours: DEFAULT_DURATION_HOURS, defaultedDuration: true };
  return { durationHours: totalMinutes / 60, defaultedDuration: false };
}

export function formatDuration(durationHours: number): string {
  const totalMinutes = Math.max(0, Math.round(durationHours * 60));
  if (totalMinutes === 0) return "0m";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

export function parseDurationText(value: string | undefined): DurationParseResult {
  const text = value?.trim().toLowerCase() ?? "";
  if (!text) return { durationHours: DEFAULT_DURATION_HOURS, defaultedDuration: true };

  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\b/);
  const minuteMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:m|min|mins|minute|minutes)\b/);

  if (hourMatch || minuteMatch) {
    const hours = hourMatch ? Number(hourMatch[1]) : 0;
    const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;
    if (Number.isFinite(hours) && Number.isFinite(minutes) && hours + minutes > 0) {
      return { durationHours: hours + minutes / 60, defaultedDuration: false };
    }
  }

  const numeric = Number(text);
  if (Number.isFinite(numeric) && numeric > 0) return { durationHours: numeric, defaultedDuration: false };

  return { durationHours: DEFAULT_DURATION_HOURS, defaultedDuration: true };
}

function parsePositiveNumber(value: string): number {
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}
