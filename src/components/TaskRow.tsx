import { Pressable, Text, View } from "react-native";
import { formatShortDate } from "../lib/dates";
import type { Task } from "../lib/types";

export function TaskRow({
  task,
  complete,
  selected,
  onToggle,
  onReschedule,
  onSelect,
}: {
  task: Task;
  complete: boolean;
  selected?: boolean;
  onToggle: () => void;
  onReschedule?: () => void;
  onSelect?: () => void;
}) {
  return (
    <View style={{ backgroundColor: "#FFFFFF", borderBottomColor: "#E5E7EB", borderBottomWidth: 1, padding: 14 }}>
      <View style={{ alignItems: "flex-start", flexDirection: "row", gap: 12 }}>
        <Pressable onPress={onSelect ?? onToggle} hitSlop={10}>
          <Text style={{ color: selected ? "#2563EB" : complete ? "#059669" : "#9CA3AF", fontSize: 23 }}>
            {selected ? "[x]" : complete ? "[✓]" : "[ ]"}
          </Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Pressable onPress={onToggle}>
            <Text
              style={{
                color: complete ? "#6B7280" : "#111827",
                fontSize: 16,
                fontWeight: "700",
                textDecorationLine: complete ? "line-through" : "none",
              }}
            >
              {task.title}
            </Text>
          </Pressable>
          {task.description ? (
            <Text style={{ color: "#4B5563", marginTop: 4 }} numberOfLines={2}>
              {task.description}
            </Text>
          ) : null}
          <Text style={{ color: "#6B7280", fontSize: 13, marginTop: 6 }}>
            {formatShortDate(task.scheduledDate)} · {task.durationHours}h · {task.energyType}
            {task.defaultedDuration ? " · defaulted" : ""}
            {task.sequenceIndex ? ` · #${task.sequenceIndex}` : ""}
            {task.recurrenceType ? ` · ${task.recurrenceType.replace("_", " ")}` : ""}
          </Text>
        </View>
        {onReschedule ? (
          <Pressable onPress={onReschedule} hitSlop={10}>
            <Text style={{ color: "#2563EB", fontWeight: "700" }}>Move</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
