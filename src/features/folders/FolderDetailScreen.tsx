import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { EmptyState } from "../../components/EmptyState";
import { TaskRow } from "../../components/TaskRow";
import {
  createRecurringCompletion,
  deleteRecurringCompletion,
  getFolder,
  listRecurringCompletions,
  listTasksForFolder,
  updateTaskStatus,
} from "../../lib/db/queries";
import { todayKey } from "../../lib/dates";
import type { Folder, RecurringCompletion, Task } from "../../lib/types";
import {
  getCurrentOccurrenceDate,
  isRecurringTaskComplete,
  isRecurringTaskDue,
  isRecurringTaskOverdue,
} from "../recurrence/recurrenceEngine";

export function FolderDetailScreen() {
  const { folderId } = useLocalSearchParams<{ folderId: string }>();
  const [folder, setFolder] = useState<Folder | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<RecurringCompletion[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [editMode, setEditMode] = useState(false);
  const today = todayKey();

  const refresh = useCallback(async () => {
    if (!folderId) return;
    const [nextFolder, nextTasks, nextCompletions] = await Promise.all([
      getFolder(folderId),
      listTasksForFolder(folderId),
      listRecurringCompletions(),
    ]);
    setFolder(nextFolder);
    setTasks(nextTasks);
    setCompletions(nextCompletions);
  }, [folderId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const selectedParam = useMemo(() => selectedTaskIds.join(","), [selectedTaskIds]);

  function toggleSelection(taskId: string) {
    setSelectedTaskIds((current) => (current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId]));
  }

  async function toggleDone(task: Task) {
    if (task.recurrenceType) {
      const completionDate = getCurrentOccurrenceDate(task, today) ?? today;
      if (isRecurringTaskComplete(task, completionDate, completions)) {
        await deleteRecurringCompletion(task.id, completionDate);
      } else {
        await createRecurringCompletion(task.id, completionDate);
      }
    } else {
      await updateTaskStatus(task.id, task.status === "done" ? "todo" : "done");
    }
    await refresh();
  }

  function openMove(task: Task) {
    router.push({ pathname: "/modals/bulk-shift", params: { folderId, selectedTaskIds: task.id } });
  }

  function openEdit(task: Task) {
    router.push({ pathname: "/modals/task", params: { folderId, taskId: task.id } });
  }

  function statusFor(task: Task): { complete: boolean; note?: string } {
    if (!task.recurrenceType) return { complete: task.status === "done" };
    const occurrenceDate = getCurrentOccurrenceDate(task, today);
    if (occurrenceDate && isRecurringTaskComplete(task, occurrenceDate, completions)) {
      return { complete: true, note: occurrenceDate === today ? "Completed today" : "Completed" };
    }
    if (isRecurringTaskDue(task, today, completions)) return { complete: false, note: "Due today" };
    if (isRecurringTaskOverdue(task, today, completions)) return { complete: false, note: "Overdue" };
    return { complete: false, note: "Recurring template" };
  }

  if (!folder) {
    return <EmptyState title="Folder not found" />;
  }

  return (
    <ScrollView style={{ backgroundColor: "#F3F4F6", flex: 1 }}>
      <View style={{ padding: 18, paddingTop: 24 }}>
        <Text style={{ color: "#111827", fontSize: 32, fontWeight: "900" }}>{folder.name}</Text>
        <Text style={{ color: "#4B5563", marginTop: 4 }}>{tasks.length} active tasks</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
          <Pressable onPress={() => router.push({ pathname: "/modals/task", params: { folderId } })} style={primaryButton}>
            <Text style={primaryText}>Add Task</Text>
          </Pressable>
          <Pressable onPress={() => router.push({ pathname: "/modals/import", params: { folderId } })} style={secondaryButton}>
            <Text style={secondaryText}>Import CSV</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setEditMode((current) => !current);
              setSelectedTaskIds([]);
            }}
            style={secondaryButton}
          >
            <Text style={secondaryText}>{editMode ? "Done" : "Edit"}</Text>
          </Pressable>
          <Pressable onPress={() => router.push(`/folders/${folderId}/archive`)} style={secondaryButton}>
            <Text style={secondaryText}>Archive</Text>
          </Pressable>
          {editMode ? (
            <Pressable
              disabled={selectedTaskIds.length === 0}
              onPress={() => router.push({ pathname: "/modals/bulk-shift", params: { folderId, selectedTaskIds: selectedParam } })}
              style={[secondaryButton, selectedTaskIds.length === 0 ? { opacity: 0.45 } : null]}
            >
              <Text style={secondaryText}>Move Selected</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {tasks.length === 0 ? <EmptyState title="No active tasks in this folder" /> : null}
      {tasks.map((task) => {
        const status = statusFor(task);
        return (
          <TaskRow
            key={task.id}
            task={task}
            complete={status.complete}
            statusNote={status.note}
            selected={selectedTaskIds.includes(task.id)}
            onSelect={editMode ? () => toggleSelection(task.id) : undefined}
            onToggle={() => (editMode ? toggleSelection(task.id) : toggleDone(task))}
            onReschedule={() => openMove(task)}
            onEdit={() => openEdit(task)}
            sequenceGroupLabel={task.sequenceGroupId}
          />
        );
      })}
    </ScrollView>
  );
}

const primaryButton = { backgroundColor: "#111827", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 };
const primaryText = { color: "#FFFFFF", fontWeight: "800" as const };
const secondaryButton = { backgroundColor: "#E5E7EB", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 };
const secondaryText = { color: "#111827", fontWeight: "800" as const };
