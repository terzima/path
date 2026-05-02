import { Link, router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { EmptyState } from "../../components/EmptyState";
import { SectionHeader } from "../../components/SectionHeader";
import { TaskRow } from "../../components/TaskRow";
import { exportBackup } from "../../lib/db/backup";
import {
  createRecurringCompletion,
  deleteRecurringCompletion,
  deleteTask,
  folderNameById,
  updateTaskStatus,
} from "../../lib/db/queries";
import { displaySequenceGroupName } from "../../lib/sequenceGroups";
import type { Task } from "../../lib/types";
import { getCurrentOccurrenceDate, isRecurringTaskComplete } from "../recurrence/recurrenceEngine";
import { useOverview } from "./useOverview";

export function OverviewScreen() {
  const { completions, overdue, recurringDue, refresh, today, todayTasks, tomorrow, tomorrowTasks, totalHours } = useOverview();
  const [folderNames, setFolderNames] = useState<Record<string, string>>({});

  useFocusEffect(
    useCallback(() => {
      folderNameById().then(setFolderNames);
    }, []),
  );

  async function toggleTask(task: Task) {
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
    router.push({
      pathname: "/modals/bulk-shift",
      params: { folderId: task.folderId ?? "", selectedTaskIds: task.id },
    });
  }

  function openEdit(task: Task) {
    router.push({ pathname: "/modals/task", params: { folderId: task.folderId ?? "", taskId: task.id } });
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

  function row(task: Task, complete: boolean, statusNote?: string) {
    return (
      <TaskRow
        key={task.id}
        task={task}
        complete={complete}
        statusNote={statusNote}
        showFolderName
        folderName={task.folderId ? folderNames[task.folderId] : "General"}
        sequenceGroupLabel={displaySequenceGroupName(task.sequenceGroupId, task.folderId)}
        onToggle={() => toggleTask(task)}
        onReschedule={() => openMove(task)}
        onEdit={() => openEdit(task)}
        onDelete={() => confirmDeleteTask(task)}
      />
    );
  }

  return (
    <ScrollView style={{ backgroundColor: "#F3F4F6", flex: 1 }} contentContainerStyle={{ paddingBottom: 140 }}>
      <View style={{ padding: 18, paddingTop: 24 }}>
        <Text style={{ color: "#111827", fontSize: 36, fontWeight: "900" }}>Path</Text>
        <Text style={{ color: "#4B5563", fontSize: 15, marginTop: 4 }}>
          {totalHours.toFixed(1)} hours scheduled today
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
          <Pressable onPress={() => router.push("/modals/task")} style={buttonStyle}>
            <Text style={buttonTextStyle}>Add Task</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/modals/import")} style={buttonStyle}>
            <Text style={buttonTextStyle}>Import CSV</Text>
          </Pressable>
          <Link href="/folders" asChild>
            <Pressable style={secondaryButtonStyle}>
              <Text style={secondaryButtonTextStyle}>Folders</Text>
            </Pressable>
          </Link>
          <Link href="/upcoming" asChild>
            <Pressable style={secondaryButtonStyle}>
              <Text style={secondaryButtonTextStyle}>Upcoming</Text>
            </Pressable>
          </Link>
          <Pressable onPress={exportBackup} style={secondaryButtonStyle}>
            <Text style={secondaryButtonTextStyle}>Backup</Text>
          </Pressable>
        </View>
      </View>

      <SectionHeader title="Today" subtitle={today} />
      {todayTasks.length + recurringDue.length === 0 ? <EmptyState title="No work scheduled today" /> : null}
      {todayTasks.map((task) => row(task, false))}
      {recurringDue.map((task) => row(task, isRecurringTaskComplete(task, today, completions), "Due today"))}

      <SectionHeader title="Overdue" />
      {overdue.length === 0 ? <EmptyState title="Nothing overdue" /> : null}
      {overdue.map((task) => row(task, false, task.recurrenceType ? "Overdue recurring item" : undefined))}

      <SectionHeader title="Tomorrow" subtitle={tomorrow} />
      {tomorrowTasks.length === 0 ? <EmptyState title="No tasks tomorrow" /> : null}
      {tomorrowTasks.map((task) => row(task, false))}
    </ScrollView>
  );
}

const buttonStyle = {
  backgroundColor: "#111827",
  borderRadius: 8,
  paddingHorizontal: 14,
  paddingVertical: 10,
};

const buttonTextStyle = {
  color: "#FFFFFF",
  fontWeight: "800" as const,
};

const secondaryButtonStyle = {
  backgroundColor: "#E5E7EB",
  borderRadius: 8,
  paddingHorizontal: 14,
  paddingVertical: 10,
};

const secondaryButtonTextStyle = {
  color: "#111827",
  fontWeight: "800" as const,
};
