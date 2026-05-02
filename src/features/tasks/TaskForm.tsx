import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { insertChecklistItems, insertTask, listFolders, makeTask } from "../../lib/db/queries";
import { todayKey } from "../../lib/dates";
import type { EnergyType, Folder, RecurrenceType } from "../../lib/types";
import { ChecklistEditor } from "./ChecklistEditor";

const weekdays = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 7 },
];

export function TaskForm() {
  const { folderId } = useLocalSearchParams<{ folderId?: string }>();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(folderId ?? null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState(todayKey());
  const [durationHours, setDurationHours] = useState("2");
  const [energyType, setEnergyType] = useState<EnergyType>("deep");
  const [sequenceIndex, setSequenceIndex] = useState("");
  const [sequenceGroupId, setSequenceGroupId] = useState("");
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType | "off">("off");
  const [recurrenceDaysOfWeek, setRecurrenceDaysOfWeek] = useState<number[]>([]);
  const [checklistItems, setChecklistItems] = useState<string[]>([]);

  useEffect(() => {
    listFolders().then(setFolders);
  }, []);

  async function save() {
    const trimmed = title.trim();
    if (!trimmed) {
      Alert.alert("Title required", "Give the task a short title.");
      return;
    }
    const parsedDuration = Number(durationHours);
    const task = makeTask({
      title: trimmed,
      description,
      folderId: selectedFolderId,
      scheduledDate,
      durationHours: Number.isFinite(parsedDuration) && parsedDuration > 0 ? parsedDuration : 2,
      defaultedDuration: !(Number.isFinite(parsedDuration) && parsedDuration > 0),
      energyType,
      sequenceIndex: sequenceIndex ? Number(sequenceIndex) : null,
      sequenceGroupId: sequenceGroupId.trim() || selectedFolderId,
      recurrenceType: recurrenceType === "off" ? null : recurrenceType,
      recurrenceDaysOfWeek: recurrenceType === "specific_days" ? recurrenceDaysOfWeek : [],
    });
    await insertTask(task);
    await insertChecklistItems(task.id, checklistItems);
    router.back();
  }

  return (
    <ScrollView style={{ backgroundColor: "#F3F4F6", flex: 1 }} contentContainerStyle={{ gap: 14, padding: 18 }}>
      <Text style={{ color: "#111827", fontSize: 30, fontWeight: "900" }}>Add Task</Text>
      <Field label="Title" value={title} onChangeText={setTitle} placeholder="3-hour focused block" />
      <Field label="Description" value={description} onChangeText={setDescription} placeholder="Optional notes" multiline />
      <Field label="Date" value={scheduledDate} onChangeText={setScheduledDate} placeholder="YYYY-MM-DD" />
      <Field label="Duration hours" value={durationHours} onChangeText={setDurationHours} keyboardType="decimal-pad" />
      <Field label="Sequence index" value={sequenceIndex} onChangeText={setSequenceIndex} keyboardType="number-pad" />
      <Field label="Sequence group" value={sequenceGroupId} onChangeText={setSequenceGroupId} placeholder="Defaults to folder" />

      <ButtonGroup
        label="Folder"
        options={[{ label: "None", value: "" }, ...folders.map((folder) => ({ label: folder.name, value: folder.id }))]}
        value={selectedFolderId ?? ""}
        onChange={(value) => setSelectedFolderId(value || null)}
      />
      <ButtonGroup
        label="Energy"
        options={[
          { label: "Deep", value: "deep" },
          { label: "Light", value: "light" },
          { label: "Admin", value: "admin" },
        ]}
        value={energyType}
        onChange={(value) => setEnergyType(value as EnergyType)}
      />
      <ButtonGroup
        label="Recurring"
        options={[
          { label: "Off", value: "off" },
          { label: "Daily", value: "daily" },
          { label: "Weekly", value: "weekly" },
          { label: "Specific", value: "specific_days" },
        ]}
        value={recurrenceType}
        onChange={(value) => setRecurrenceType(value as RecurrenceType | "off")}
      />

      {recurrenceType === "specific_days" ? (
        <View style={{ gap: 8 }}>
          <Text style={{ color: "#111827", fontWeight: "800" }}>Specific days</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {weekdays.map((day) => {
              const active = recurrenceDaysOfWeek.includes(day.value);
              return (
                <Pressable
                  key={day.value}
                  onPress={() =>
                    setRecurrenceDaysOfWeek((current) =>
                      active ? current.filter((value) => value !== day.value) : [...current, day.value].sort(),
                    )
                  }
                  style={[chipStyle, active ? activeChipStyle : null]}
                >
                  <Text style={active ? activeChipTextStyle : chipTextStyle}>{day.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      <ChecklistEditor items={checklistItems} onChange={setChecklistItems} />

      <Pressable onPress={save} style={saveButton}>
        <Text style={{ color: "#FFFFFF", fontWeight: "900", textAlign: "center" }}>Save Task</Text>
      </Pressable>
    </ScrollView>
  );
}

function Field({
  label,
  ...props
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "decimal-pad" | "number-pad";
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: "#111827", fontWeight: "800" }}>{label}</Text>
      <TextInput {...props} style={[inputStyle, props.multiline ? { minHeight: 82, textAlignVertical: "top" } : null]} />
    </View>
  );
}

function ButtonGroup({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  options: Array<{ label: string; value: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: "#111827", fontWeight: "800" }}>{label}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <Pressable key={option.value} onPress={() => onChange(option.value)} style={[chipStyle, active ? activeChipStyle : null]}>
              <Text style={active ? activeChipTextStyle : chipTextStyle}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const inputStyle = {
  backgroundColor: "#FFFFFF",
  borderColor: "#D1D5DB",
  borderRadius: 8,
  borderWidth: 1,
  paddingHorizontal: 12,
  paddingVertical: 11,
};

const chipStyle = {
  backgroundColor: "#E5E7EB",
  borderRadius: 999,
  paddingHorizontal: 12,
  paddingVertical: 8,
};

const activeChipStyle = {
  backgroundColor: "#111827",
};

const chipTextStyle = {
  color: "#111827",
  fontWeight: "800" as const,
};

const activeChipTextStyle = {
  color: "#FFFFFF",
  fontWeight: "800" as const,
};

const saveButton = {
  backgroundColor: "#111827",
  borderRadius: 8,
  marginBottom: 30,
  marginTop: 8,
  padding: 14,
};
