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
import { chooseDefaultFolderId, insertChecklistItems, insertTask, listFolders, makeTask } from "../../lib/db/queries";
import { todayKey } from "../../lib/dates";
import { scheduleDrafts } from "../scheduling/scheduleEngine";
import { pickCsvDrafts } from "./documentImport";
import type { ImportDraftTask } from "./importDraft";

export function ImportReviewScreen() {
  const { folderId } = useLocalSearchParams<{ folderId?: string }>();
  const [drafts, setDrafts] = useState<ImportDraftTask[]>([]);
  const [startDate, setStartDate] = useState(todayKey());
  const [resolvedFolderId, setResolvedFolderId] = useState<string | null>(folderId ?? null);

  useEffect(() => {
    listFolders().then((folders) => setResolvedFolderId(chooseDefaultFolderId(folders, folderId ?? null)));
  }, [folderId]);

  async function pickFile() {
    try {
      const nextDrafts = await pickCsvDrafts();
      setDrafts(scheduleDrafts(nextDrafts, startDate));
    } catch (error) {
      Alert.alert("Import failed", error instanceof Error ? error.message : "Could not read that CSV.");
    }
  }

  function updateDraft(id: string, patch: Partial<ImportDraftTask>) {
    setDrafts((current) => current.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft)));
  }

  async function save() {
    if (drafts.length === 0) {
      Alert.alert("No tasks", "Choose a CSV first.");
      return;
    }
    for (const draft of drafts) {
      const task = makeTask({
        title: draft.title,
        description: draft.description,
        folderId: resolvedFolderId,
        scheduledDate: draft.scheduledDate ?? startDate,
        durationHours: draft.durationHours,
        defaultedDuration: draft.defaultedDuration,
        energyType: draft.energyType,
        sequenceIndex: draft.sequenceIndex,
        sequenceGroupId: draft.sequenceGroupId ?? resolvedFolderId,
      });
      await insertTask(task);
      await insertChecklistItems(task.id, draft.checklistItems);
    }
    router.back();
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
          <Text style={{ color: "#111827", fontSize: 30, fontWeight: "900" }}>Import CSV</Text>
          <Text style={{ color: "#4B5563" }}>CSV is the reliable path. PDF parsing is intentionally outside this MVP.</Text>

          <View style={{ gap: 6 }}>
            <Text style={{ color: "#111827", fontWeight: "800" }}>Start date</Text>
            <TextInput value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" style={inputStyle} />
          </View>

          <Pressable
            onPress={async () => {
              const scheduled = scheduleDrafts(drafts, startDate);
              setDrafts(scheduled);
            }}
            style={secondaryButton}
          >
            <Text style={secondaryText}>Apply Sequence Dates</Text>
          </Pressable>

          <Pressable onPress={pickFile} style={primaryButton}>
            <Text style={primaryText}>Choose CSV</Text>
          </Pressable>

          {drafts.map((draft, index) => (
            <View key={draft.id} style={{ backgroundColor: "#FFFFFF", borderRadius: 8, gap: 8, padding: 12 }}>
              <Text style={{ color: "#6B7280", fontWeight: "800" }}>Task {index + 1}</Text>
              <TextInput value={draft.title} onChangeText={(title) => updateDraft(draft.id, { title })} style={inputStyle} />
              <TextInput
                value={draft.scheduledDate ?? ""}
                onChangeText={(scheduledDate) => updateDraft(draft.id, { scheduledDate })}
                placeholder="YYYY-MM-DD"
                style={inputStyle}
              />
              <TextInput
                value={String(draft.durationHours)}
                onChangeText={(value) => updateDraft(draft.id, { durationHours: Number(value) || 2, defaultedDuration: false })}
                keyboardType="decimal-pad"
                style={inputStyle}
              />
              {draft.defaultedDuration ? <Text style={{ color: "#6B7280" }}>Defaulted to 2h</Text> : null}
            </View>
          ))}

          <Pressable onPress={save} style={primaryButton}>
            <Text style={primaryText}>Import Tasks</Text>
          </Pressable>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
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

const primaryButton = { backgroundColor: "#111827", borderRadius: 8, padding: 14 };
const primaryText = { color: "#FFFFFF", fontWeight: "900" as const, textAlign: "center" as const };
const secondaryButton = { backgroundColor: "#E5E7EB", borderRadius: 8, padding: 14 };
const secondaryText = { color: "#111827", fontWeight: "900" as const, textAlign: "center" as const };
