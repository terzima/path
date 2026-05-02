import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { EmptyState } from "../../components/EmptyState";
import { SectionHeader } from "../../components/SectionHeader";
import { TaskRow } from "../../components/TaskRow";
import { folderNameById, listTasks, updateTaskStatus } from "../../lib/db/queries";
import { formatShortDate, todayKey } from "../../lib/dates";
import type { Task } from "../../lib/types";

export function UpcomingScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [folderNames, setFolderNames] = useState<Record<string, string>>({});
  const today = todayKey();

  const refresh = useCallback(async () => {
    const [nextTasks, names] = await Promise.all([listTasks(), folderNameById()]);
    setTasks(nextTasks);
    setFolderNames(names);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const grouped = useMemo(() => {
    const futureTasks = tasks.filter((task) => !task.recurrenceType && task.status === "todo" && task.scheduledDate > today);
    return futureTasks.reduce<Record<string, Task[]>>((groups, task) => {
      groups[task.scheduledDate] = [...(groups[task.scheduledDate] ?? []), task];
      return groups;
    }, {});
  }, [tasks, today]);

  const dates = Object.keys(grouped).sort();

  async function toggleTask(task: Task) {
    await updateTaskStatus(task.id, task.status === "done" ? "todo" : "done");
    await refresh();
  }

  function openMove(task: Task) {
    router.push({
      pathname: "/modals/bulk-shift",
      params: { folderId: task.folderId ?? "", selectedTaskIds: task.id },
    });
  }

  function openEdit(task: Task) {
    router.push({ pathname: "/modals/task", params: { folderId: task.folderId ?? "", taskId: task.id } });
  }

  return (
    <ScrollView style={{ backgroundColor: "#F3F4F6", flex: 1 }}>
      <View style={{ padding: 18, paddingTop: 24 }}>
        <Text style={{ color: "#111827", fontSize: 32, fontWeight: "900" }}>Upcoming</Text>
        <Text style={{ color: "#4B5563", marginTop: 4 }}>Future scheduled work, grouped by date.</Text>
      </View>

      {dates.length === 0 ? <EmptyState title="No upcoming tasks" /> : null}
      {dates.map((date) => (
        <View key={date}>
          <SectionHeader title={formatShortDate(date)} subtitle={date} />
          {grouped[date].map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              complete={false}
              showFolderName
              folderName={task.folderId ? folderNames[task.folderId] : "General"}
              sequenceGroupLabel={task.sequenceGroupId}
              onToggle={() => toggleTask(task)}
              onReschedule={() => openMove(task)}
              onEdit={() => openEdit(task)}
            />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
