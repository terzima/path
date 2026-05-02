import type { Task } from "./types";

export function displaySequenceGroupName(
  sequenceGroupId: string | null | undefined,
  folderId: string | null | undefined,
): string {
  if (!sequenceGroupId || sequenceGroupId === folderId) return "Main";
  return sequenceGroupId;
}

export function sequenceGroupInputValue(
  sequenceGroupId: string | null | undefined,
  folderId: string | null | undefined,
): string {
  if (!sequenceGroupId || sequenceGroupId === folderId) return "Main";
  return sequenceGroupId;
}

export function sequenceGroupValueFromInput(input: string, folderId: string | null | undefined): string | null {
  const trimmed = input.trim();
  if (!trimmed || trimmed.toLowerCase() === "main") return folderId ?? null;
  return trimmed;
}

export function isTaskInSequenceGroup(task: Task, sequenceGroupId: string, folderId: string): boolean {
  if (sequenceGroupId === folderId) return !task.sequenceGroupId || task.sequenceGroupId === folderId;
  return task.sequenceGroupId === sequenceGroupId;
}

export function normalizeSequenceGroupAfterMoveToMain(task: Task, folderId: string): Task {
  return {
    ...task,
    sequenceGroupId: folderId,
    sequenceIndex: null,
  };
}

export function canDeleteSequenceGroup(sequenceGroupId: string, folderId: string): boolean {
  return sequenceGroupId !== folderId;
}
