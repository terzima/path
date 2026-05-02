import type { Folder, Task } from "./types";

export function chooseDefaultFolderId(folders: Folder[], explicitFolderId: string | null | undefined): string {
  if (explicitFolderId) return explicitFolderId;
  return folders.find((folder) => folder.name.toLowerCase() === "general")?.id ?? folders[0]?.id ?? "general";
}

export function chooseSequenceGroup(input: string, selectedFolderId: string | null): string | null {
  const trimmed = input.trim();
  if (trimmed) return trimmed;
  return selectedFolderId;
}

export function uniqueSequenceGroups(tasks: Task[]): string[] {
  return Array.from(
    new Set(
      tasks
        .map((task) => task.sequenceGroupId)
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort((a, b) => a.localeCompare(b));
}

export function toggleChecklistDoneValue(done: boolean): boolean {
  return !done;
}
