import { durationInputsToHours, formatDuration, parseDurationText, splitDurationHours } from "../src/lib/duration";

test("formats durations as friendly hours and minutes", () => {
  expect(formatDuration(1 / 3)).toBe("20m");
  expect(formatDuration(1)).toBe("1h");
  expect(formatDuration(1.5)).toBe("1h 30m");
  expect(formatDuration(2.25)).toBe("2h 15m");
});

test("splits stored decimal hours into form inputs", () => {
  expect(splitDurationHours(1.5)).toEqual({ hours: "1", minutes: "30" });
  expect(splitDurationHours(20 / 60)).toEqual({ hours: "", minutes: "20" });
  expect(splitDurationHours(2)).toEqual({ hours: "2", minutes: "" });
});

test("normalizes hours and minutes inputs into decimal hours", () => {
  expect(durationInputsToHours("1", "30")).toEqual({ durationHours: 1.5, defaultedDuration: false });
  expect(durationInputsToHours("", "90")).toEqual({ durationHours: 1.5, defaultedDuration: false });
  expect(durationInputsToHours("", "")).toEqual({ durationHours: 2, defaultedDuration: true });
});

test("parses csv duration text", () => {
  expect(parseDurationText("2")).toEqual({ durationHours: 2, defaultedDuration: false });
  expect(parseDurationText("1.5h")).toEqual({ durationHours: 1.5, defaultedDuration: false });
  expect(parseDurationText("90m")).toEqual({ durationHours: 1.5, defaultedDuration: false });
  expect(parseDurationText("1h 30m")).toEqual({ durationHours: 1.5, defaultedDuration: false });
  expect(parseDurationText("nope")).toEqual({ durationHours: 2, defaultedDuration: true });
});
