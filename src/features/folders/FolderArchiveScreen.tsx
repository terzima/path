import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { EmptyState } from "../../components/EmptyState";
import { SectionHeader } from "../../components/SectionHeader";
import { TaskRow } from "../../components/TaskRow";
import { deleteTasks, getFolder, listArchivedTasksForFolder, restoreTaskToActive } from "../../lib/db/queries";
import { monthKey, monthLabel } from "../../lib/dates";
import type { Folder, Task } from "../../lib/types";

export function FolderArchiveScreen() {
  const { folderId } = useLocalSearchParams<{ folderId: string }>();
  const [folder, setFolder] = useState<Folder | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [editMode, setEditMode] = useState(false);

  const refresh = useCallback(async () => {
    if (!folderId) return;
    const [nextFolder, nextTasks] = await Promise.all([getFolder(folderId), listArchivedTasksForFolder(folderId)]);
    setFolder(nextFolder);
    setTasks(nextTasks);
  }, [folderId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const grouped = useMemo(
    () =>
      tasks.reduce<Record<string, Task[]>>((groups, task) => {
        const key = monthKey(task.scheduledDate);
        groups[key] = [...(groups[key] ?? []), task];
        return groups;
      }, {}),
    [tasks],
  );
  const months = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  function toggleSelection(taskId: string) {
    setSelectedTaskIds((current) => (current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId]));
  }

  async function restore(taskId: string) {
    await restoreTaskToActive(taskId);
    await refresh();
  }

  function confirmDelete(taskIds: string[], label: string) {
    Alert.alert("Delete archived tasks?", label, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteTasks(taskIds);
          setSelectedTaskIds((current) => current.filter((id) => !taskIds.includes(id)));
          await refresh();
        },
      },
    ]);
  }

  if (!folder) return <EmptyState title="Folder not found" />;

  return (
    <ScrollView style={{ backgroundColor: "#F3F4F6", flex: 1 }}>
      <View style={{ padding: 18, paddingTop: 24 }}>
        <Text style={{ color: "#111827", fontSize: 32, fontWeight: "900" }}>{folder.name} Archive</Text>
        <Text style={{ color: "#4B5563", marginTop: 4 }}>{tasks.length} finished tasks</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
          <Pressable
            onPress={() => {
              setEditMode((current) => !current);
              setSelectedTaskIds([]);
            }}
            style={secondaryButton}
          >
            <Text style={secondaryText}>{editMode ? "Done" : "Edit"}</Text>
          </Pressable>
          {editMode ? (
            <Pressable
              disabled={selectedTaskIds.length === 0}
              onPress={() => confirmDelete(selectedTaskIds, `Delete ${selectedTaskIds.length} selected task(s).`)}
              style={[dangerButton, selectedTaskIds.length === 0 ? { opacity: 0.45 } : null]}
            >
              <Text style={dangerText}>Delete Selected</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {tasks.length === 0 ? <EmptyState title="No archived tasks" /> : null}
      {months.map((key) => (
        <View key={key}>
          <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingRight: 18 }}>
            <SectionHeader title={monthLabel(key)} />
            <Pressable onPress={() => confirmDelete(grouped[key].map((task) => task.id), `Delete all tasks from ${monthLabel(key)}.`)}>
              <Text style={{ color: "#B91C1C", fontWeight: "800" }}>Delete Month</Text>
            </Pressable>
          </View>
          {grouped[key].map((task) => (
            <View key={task.id}>
              <TaskRow
                task={task}
                complete
                selected={selectedTaskIds.includes(task.id)}
                onSelect={editMode ? () => toggleSelection(task.id) : undefined}
                onToggle={() => (editMode ? toggleSelection(task.id) : restore(task.id))}
                onEdit={() => router.push({ pathname: "/modals/task", params: { folderId, taskId: task.id } })}
                sequenceGroupLabel={task.sequenceGroupId}
                statusNote="Archived"
              />
              <View style={{ backgroundColor: "#FFFFFF", flexDirection: "row", gap: 14, justifyContent: "flex-end", padding: 10 }}>
                <Pressable onPress={() => restore(task.id)}>
                  <Text style={{ color: "#2563EB", fontWeight: "800" }}>Restore</Text>
                </Pressable>
                <Pressable onPress={() => confirmDelete([task.id], "Delete this archived task.")}>
                  <Text style={{ color: "#B91C1C", fontWeight: "800" }}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const secondaryButton = { backgroundColor: "#E5E7EB", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 };
const secondaryText = { color: "#111827", fontWeight: "800" as const };
const dangerButton = { backgroundColor: "#FEE2E2", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 };
const dangerText = { color: "#B91C1C", fontWeight: "800" as const };
