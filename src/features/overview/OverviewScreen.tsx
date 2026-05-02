import { Link, router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { EmptyState } from "../../components/EmptyState";
import { SectionHeader } from "../../components/SectionHeader";
import { TaskRow } from "../../components/TaskRow";
import { exportBackup } from "../../lib/db/backup";
import {
  createRecurringCompletion,
  deleteRecurringCompletion,
  updateTaskDate,
  updateTaskStatus,
} from "../../lib/db/queries";
import { addDays } from "../../lib/dates";
import type { Task } from "../../lib/types";
import { isRecurringTaskComplete } from "../recurrence/recurrenceEngine";
import { useOverview } from "./useOverview";

export function OverviewScreen() {
  const { completions, overdue, recurringDue, refresh, today, todayTasks, totalHours, upcoming } = useOverview();

  async function toggleTask(task: Task) {
    if (task.recurrenceType) {
      if (isRecurringTaskComplete(task, today, completions)) {
        await deleteRecurringCompletion(task.id, today);
      } else {
        await createRecurringCompletion(task.id, today);
      }
    } else {
      await updateTaskStatus(task.id, task.status === "done" ? "todo" : "done");
    }
    await refresh();
  }

  async function moveToTomorrow(task: Task) {
    await updateTaskDate(task.id, addDays(today, 1));
    await refresh();
  }

  return (
    <ScrollView style={{ backgroundColor: "#F3F4F6", flex: 1 }}>
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
          <Pressable onPress={exportBackup} style={secondaryButtonStyle}>
            <Text style={secondaryButtonTextStyle}>Backup</Text>
          </Pressable>
        </View>
      </View>

      <SectionHeader title="Today" subtitle={today} />
      {todayTasks.length + recurringDue.length === 0 ? <EmptyState title="No work scheduled today" /> : null}
      {[...todayTasks, ...recurringDue].map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          complete={task.recurrenceType ? isRecurringTaskComplete(task, today, completions) : task.status === "done"}
          onToggle={() => toggleTask(task)}
          onReschedule={() => moveToTomorrow(task)}
        />
      ))}

      <SectionHeader title="Overdue" />
      {overdue.length === 0 ? <EmptyState title="Nothing overdue" /> : null}
      {overdue.map((task) => (
        <TaskRow key={task.id} task={task} complete={false} onToggle={() => toggleTask(task)} onReschedule={() => moveToTomorrow(task)} />
      ))}

      <SectionHeader title="Upcoming" />
      {upcoming.length === 0 ? <EmptyState title="No upcoming tasks" /> : null}
      {upcoming.map((task) => (
        <TaskRow key={task.id} task={task} complete={false} onToggle={() => toggleTask(task)} onReschedule={() => moveToTomorrow(task)} />
      ))}
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
