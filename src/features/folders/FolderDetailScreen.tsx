import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { EmptyState } from "../../components/EmptyState";
import { TaskRow } from "../../components/TaskRow";
import { getFolder, listTasksForFolder, updateTaskStatus } from "../../lib/db/queries";
import type { Folder, Task } from "../../lib/types";

export function FolderDetailScreen() {
  const { folderId } = useLocalSearchParams<{ folderId: string }>();
  const [folder, setFolder] = useState<Folder | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    if (!folderId) return;
    const [nextFolder, nextTasks] = await Promise.all([getFolder(folderId), listTasksForFolder(folderId)]);
    setFolder(nextFolder);
    setTasks(nextTasks);
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
    await updateTaskStatus(task.id, task.status === "done" ? "todo" : "done");
    await refresh();
  }

  if (!folder) {
    return <EmptyState title="Folder not found" />;
  }

  return (
    <ScrollView style={{ backgroundColor: "#F3F4F6", flex: 1 }}>
      <View style={{ padding: 18, paddingTop: 24 }}>
        <Text style={{ color: "#111827", fontSize: 32, fontWeight: "900" }}>{folder.name}</Text>
        <Text style={{ color: "#4B5563", marginTop: 4 }}>{tasks.length} tasks</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
          <Pressable onPress={() => router.push({ pathname: "/modals/task", params: { folderId } })} style={primaryButton}>
            <Text style={primaryText}>Add Task</Text>
          </Pressable>
          <Pressable onPress={() => router.push({ pathname: "/modals/import", params: { folderId } })} style={secondaryButton}>
            <Text style={secondaryText}>Import CSV</Text>
          </Pressable>
          <Pressable
            disabled={selectedTaskIds.length === 0}
            onPress={() => router.push({ pathname: "/modals/bulk-shift", params: { folderId, selectedTaskIds: selectedParam } })}
            style={[secondaryButton, selectedTaskIds.length === 0 ? { opacity: 0.45 } : null]}
          >
            <Text style={secondaryText}>Bulk Shift</Text>
          </Pressable>
        </View>
      </View>

      {tasks.length === 0 ? <EmptyState title="No tasks in this folder" /> : null}
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          complete={task.status === "done"}
          selected={selectedTaskIds.includes(task.id)}
          onSelect={() => toggleSelection(task.id)}
          onToggle={() => toggleDone(task)}
        />
      ))}
    </ScrollView>
  );
}

const primaryButton = { backgroundColor: "#111827", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 };
const primaryText = { color: "#FFFFFF", fontWeight: "800" as const };
const secondaryButton = { backgroundColor: "#E5E7EB", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 };
const secondaryText = { color: "#111827", fontWeight: "800" as const };
