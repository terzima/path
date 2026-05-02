import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { EmptyState } from "../../components/EmptyState";
import { TaskRow } from "../../components/TaskRow";
import {
  createRecurringCompletion,
  deleteRecurringCompletion,
  deleteTask,
  deleteTasksInSequenceGroup,
  getFolder,
  listTasksInSequenceGroup,
  listRecurringCompletions,
  listTasksForFolder,
  moveSequenceGroupTasksToMain,
  updateTaskStatus,
} from "../../lib/db/queries";
import { todayKey } from "../../lib/dates";
import { canDeleteSequenceGroup, displaySequenceGroupName, isTaskInSequenceGroup } from "../../lib/sequenceGroups";
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
  const [activeSequenceGroupId, setActiveSequenceGroupId] = useState<string | "all">("all");
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
  const sequenceGroupIds = useMemo(() => {
    if (!folderId) return [];
    return Array.from(new Set([folderId, ...tasks.map((task) => task.sequenceGroupId).filter((value): value is string => Boolean(value))]));
  }, [folderId, tasks]);
  const visibleTasks = useMemo(() => {
    if (!folderId || activeSequenceGroupId === "all") return tasks;
    return tasks.filter((task) => isTaskInSequenceGroup(task, activeSequenceGroupId, folderId));
  }, [activeSequenceGroupId, folderId, tasks]);

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

  function confirmDeleteTask(task: Task) {
    Alert.alert(`Delete "${task.title}"?`, "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteTask(task.id);
          await refresh();
        },
      },
    ]);
  }

  async function confirmDeleteSequenceGroup(sequenceGroupId: string) {
    if (!folderId || !canDeleteSequenceGroup(sequenceGroupId, folderId)) return;
    const count = (await listTasksInSequenceGroup(folderId, sequenceGroupId)).length;
    Alert.alert(
      `Delete "${displaySequenceGroupName(sequenceGroupId, folderId)}"?`,
      `${count} active task${count === 1 ? "" : "s"} are currently shown in this group. Choose what happens to tasks in this sequence group.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Move Tasks to Main",
          onPress: async () => {
            await moveSequenceGroupTasksToMain(folderId, sequenceGroupId);
            setActiveSequenceGroupId("all");
            await refresh();
          },
        },
        {
          text: "Delete Group and Tasks",
          style: "destructive",
          onPress: async () => {
            await deleteTasksInSequenceGroup(folderId, sequenceGroupId);
            setActiveSequenceGroupId("all");
            await refresh();
          },
        },
      ],
    );
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
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
          <Pressable
            onPress={() => setActiveSequenceGroupId("all")}
            style={[filterChip, activeSequenceGroupId === "all" ? activeFilterChip : null]}
          >
            <Text style={activeSequenceGroupId === "all" ? activeFilterText : filterText}>All</Text>
          </Pressable>
          {sequenceGroupIds.map((groupId) => {
            const active = activeSequenceGroupId === groupId;
            return (
              <View key={groupId} style={{ alignItems: "center", flexDirection: "row", gap: 6 }}>
                <Pressable onPress={() => setActiveSequenceGroupId(groupId)} style={[filterChip, active ? activeFilterChip : null]}>
                  <Text style={active ? activeFilterText : filterText}>{displaySequenceGroupName(groupId, folderId)}</Text>
                </Pressable>
                {active && canDeleteSequenceGroup(groupId, folderId) ? (
                  <Pressable onPress={() => void confirmDeleteSequenceGroup(groupId)} hitSlop={8}>
                    <Text style={{ color: "#B91C1C", fontSize: 12, fontWeight: "800" }}>Delete</Text>
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </View>
      </View>

      {visibleTasks.length === 0 ? <EmptyState title="No active tasks in this view" /> : null}
      {visibleTasks.map((task) => {
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
            onDelete={() => confirmDeleteTask(task)}
            sequenceGroupLabel={displaySequenceGroupName(task.sequenceGroupId, folderId)}
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
const filterChip = { backgroundColor: "#E5E7EB", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 };
const activeFilterChip = { backgroundColor: "#111827" };
const filterText = { color: "#111827", fontWeight: "800" as const };
const activeFilterText = { color: "#FFFFFF", fontWeight: "800" as const };
