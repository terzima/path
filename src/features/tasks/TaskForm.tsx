import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {
  chooseDefaultFolderId,
  chooseSequenceGroup,
  getTask,
  insertChecklistItems,
  insertTask,
  listChecklistItems,
  listFolders,
  listSequenceGroupsForFolder,
  makeTask,
  replaceChecklistItems,
  updateTask,
} from "../../lib/db/queries";
import { todayKey } from "../../lib/dates";
import type { EnergyType, Folder, RecurrenceType } from "../../lib/types";
import { recurrenceOptions } from "../recurrence/recurrenceTypes";
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
  const { folderId, taskId } = useLocalSearchParams<{ folderId?: string; taskId?: string }>();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [sequenceGroups, setSequenceGroups] = useState<string[]>([]);
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
  const [loaded, setLoaded] = useState(false);
  const isEditing = Boolean(taskId);

  useEffect(() => {
    async function load() {
      const nextFolders = await listFolders();
      setFolders(nextFolders);
      const defaultFolderId = chooseDefaultFolderId(nextFolders, folderId ?? null);
      setSelectedFolderId(defaultFolderId);

      if (taskId) {
        const task = await getTask(taskId);
        if (task) {
          setSelectedFolderId(task.folderId ?? defaultFolderId);
          setTitle(task.title);
          setDescription(task.description);
          setScheduledDate(task.scheduledDate);
          setDurationHours(String(task.durationHours));
          setEnergyType(task.energyType);
          setSequenceIndex(task.sequenceIndex ? String(task.sequenceIndex) : "");
          setSequenceGroupId(task.sequenceGroupId ?? "");
          setRecurrenceType(task.recurrenceType ?? "off");
          setRecurrenceDaysOfWeek(task.recurrenceDaysOfWeek);
          setChecklistItems((await listChecklistItems(task.id)).map((item) => item.text));
        }
      }
      setLoaded(true);
    }
    load();
  }, [folderId, taskId]);

  useEffect(() => {
    if (!selectedFolderId) {
      setSequenceGroups([]);
      return;
    }
    listSequenceGroupsForFolder(selectedFolderId).then(setSequenceGroups);
  }, [selectedFolderId]);

  async function save() {
    const trimmed = title.trim();
    if (!trimmed) {
      Alert.alert("Title required", "Give the task a short title.");
      return;
    }
    const parsedDuration = Number(durationHours);
    const resolvedDuration = Number.isFinite(parsedDuration) && parsedDuration > 0 ? parsedDuration : 2;
    const resolvedSequenceIndex = sequenceIndex ? Number(sequenceIndex) : null;
    const base = {
      title: trimmed,
      description,
      folderId: selectedFolderId,
      scheduledDate,
      durationHours: resolvedDuration,
      defaultedDuration: !(Number.isFinite(parsedDuration) && parsedDuration > 0),
      energyType,
      sequenceIndex: Number.isFinite(resolvedSequenceIndex) ? resolvedSequenceIndex : null,
      sequenceGroupId: chooseSequenceGroup(sequenceGroupId, selectedFolderId),
      recurrenceType: recurrenceType === "off" ? null : recurrenceType,
      recurrenceDaysOfWeek: recurrenceType === "specific_days" ? recurrenceDaysOfWeek : [],
    };

    if (taskId) {
      const existing = await getTask(taskId);
      if (!existing) {
        Alert.alert("Task missing", "This task could not be found.");
        return;
      }
      await updateTask({ ...existing, ...base });
      await replaceChecklistItems(existing.id, checklistItems);
    } else {
      const task = makeTask(base);
      await insertTask(task);
      await insertChecklistItems(task.id, checklistItems);
    }
    router.back();
  }

  if (!loaded) {
    return (
      <View style={{ alignItems: "center", backgroundColor: "#F3F4F6", flex: 1, justifyContent: "center" }}>
        <Text style={{ color: "#4B5563", fontWeight: "800" }}>Loading</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          style={{ backgroundColor: "#F3F4F6", flex: 1 }}
          contentContainerStyle={{ gap: 14, padding: 18, paddingBottom: 120 }}
        >
          <Text style={{ color: "#111827", fontSize: 30, fontWeight: "900" }}>
            {isEditing ? "Edit Task" : "Add Task"}
          </Text>
          <Field label="Title" value={title} onChangeText={setTitle} placeholder="3-hour focused block" />
          <Field label="Description" value={description} onChangeText={setDescription} placeholder="Optional notes" multiline />
          <Field label="Date" value={scheduledDate} onChangeText={setScheduledDate} placeholder="YYYY-MM-DD" />
          <Field label="Duration hours" value={durationHours} onChangeText={setDurationHours} keyboardType="decimal-pad" />
          <Field label="Sequence index" value={sequenceIndex} onChangeText={setSequenceIndex} keyboardType="number-pad" />
          <Field label="Sequence group" value={sequenceGroupId} onChangeText={setSequenceGroupId} placeholder="Defaults to folder" />

          <ButtonGroup
            label="Folder"
            options={folders.map((folder) => ({ label: folder.name, value: folder.id }))}
            value={selectedFolderId ?? ""}
            onChange={(value) => setSelectedFolderId(value)}
          />

          {sequenceGroups.length > 0 ? (
            <ButtonGroup
              label="Existing sequence groups"
              options={sequenceGroups.map((group) => ({ label: group, value: group }))}
              value={sequenceGroupId}
              onChange={setSequenceGroupId}
            />
          ) : null}

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
            options={recurrenceOptions.map((option) => ({ label: option.label, value: option.value }))}
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
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
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
  marginTop: 8,
  padding: 14,
};
