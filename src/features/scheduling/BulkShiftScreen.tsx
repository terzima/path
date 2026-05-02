import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { createId } from "../../lib/id";
import {
  deleteScheduleChange,
  getLastScheduleChange,
  insertScheduleChange,
  listTasksForShift,
  updateTaskDates,
} from "../../lib/db/queries";
import type { Task } from "../../lib/types";
import { shiftTasks } from "./cascadeShift";
import { undoScheduleChange } from "./undoScheduleChange";

export function BulkShiftScreen() {
  const { folderId, selectedTaskIds } = useLocalSearchParams<{ folderId?: string; selectedTaskIds?: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dayDelta, setDayDelta] = useState(1);
  const [cascade, setCascade] = useState(false);
  const selectedIds = selectedTaskIds ? selectedTaskIds.split(",").filter(Boolean) : [];

  useEffect(() => {
    listTasksForShift(folderId || null, selectedIds).then(setTasks);
  }, [folderId, selectedTaskIds]);

  const selectedTasks = tasks.filter((task) => selectedIds.includes(task.id));

  async function applyShift() {
    const result = shiftTasks({ tasks, selectedTaskIds: selectedIds, dayDelta, cascade });
    const changed = result.tasks.filter((task) => result.change.taskIds.includes(task.id));
    await updateTaskDates(changed);
    await insertScheduleChange({
      id: createId(),
      changedAt: new Date().toISOString(),
      ...result.change,
    });
    Alert.alert("Shift applied", `Moved ${changed.length} task${changed.length === 1 ? "" : "s"}.`);
    router.back();
  }

  async function undoLast() {
    const last = await getLastScheduleChange();
    if (!last) {
      Alert.alert("Nothing to undo", "There is no schedule shift to undo.");
      return;
    }
    const restored = undoScheduleChange(tasks, last).filter((task) => last.taskIds.includes(task.id));
    await updateTaskDates(restored);
    await deleteScheduleChange(last.id);
    Alert.alert("Undo complete", "The last schedule shift was restored.");
    router.back();
  }

  return (
    <ScrollView style={{ backgroundColor: "#F3F4F6", flex: 1 }} contentContainerStyle={{ gap: 16, padding: 18, paddingBottom: 140 }}>
      <Text style={{ color: "#111827", fontSize: 30, fontWeight: "900" }}>Bulk Shift</Text>
      <Text style={{ color: "#4B5563" }}>
        {cascade
          ? "Cascade will move selected tasks and later tasks in the same sequence."
          : "Default mode moves only selected tasks."}
      </Text>

      <View style={{ backgroundColor: "#FFFFFF", borderRadius: 8, padding: 14 }}>
        <Text style={{ color: "#111827", fontWeight: "800", marginBottom: 8 }}>Selected</Text>
        {selectedTasks.map((task) => (
          <Text key={task.id} style={{ color: "#374151", paddingVertical: 3 }}>
            {task.sequenceIndex ? `#${task.sequenceIndex} ` : ""}
            {task.title}
          </Text>
        ))}
      </View>

      <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between" }}>
        <Pressable onPress={() => setDayDelta((value) => value - 1)} style={stepButton}>
          <Text style={stepText}>-</Text>
        </Pressable>
        <Text style={{ color: "#111827", fontSize: 18, fontWeight: "900" }}>{dayDelta} days</Text>
        <Pressable onPress={() => setDayDelta((value) => value + 1)} style={stepButton}>
          <Text style={stepText}>+</Text>
        </Pressable>
      </View>

      <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ color: "#111827", fontWeight: "800" }}>Cascade future tasks</Text>
        <Switch value={cascade} onValueChange={setCascade} />
      </View>

      <Pressable disabled={selectedIds.length === 0} onPress={applyShift} style={primaryButton}>
        <Text style={primaryText}>Apply Move</Text>
      </Pressable>
      <Pressable onPress={undoLast} style={secondaryButton}>
        <Text style={secondaryText}>Undo Last Shift</Text>
      </Pressable>
    </ScrollView>
  );
}

const stepButton = { backgroundColor: "#E5E7EB", borderRadius: 8, paddingHorizontal: 28, paddingVertical: 12 };
const stepText = { color: "#111827", fontSize: 22, fontWeight: "900" as const };
const primaryButton = { backgroundColor: "#111827", borderRadius: 8, padding: 14 };
const primaryText = { color: "#FFFFFF", fontWeight: "900" as const, textAlign: "center" as const };
const secondaryButton = { backgroundColor: "#E5E7EB", borderRadius: 8, padding: 14 };
const secondaryText = { color: "#111827", fontWeight: "900" as const, textAlign: "center" as const };
