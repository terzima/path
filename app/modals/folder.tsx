import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { createFolder } from "../../src/lib/db/queries";

export default function FolderModal() {
  const [name, setName] = useState("");

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert("Name required", "Give the folder a name.");
      return;
    }
    await createFolder(trimmed);
    router.back();
  }

  return (
    <View style={{ backgroundColor: "#F3F4F6", flex: 1, gap: 14, padding: 18 }}>
      <Text style={{ color: "#111827", fontSize: 30, fontWeight: "900" }}>Add Folder</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Rolo Dev"
        style={{
          backgroundColor: "#FFFFFF",
          borderColor: "#D1D5DB",
          borderRadius: 8,
          borderWidth: 1,
          paddingHorizontal: 12,
          paddingVertical: 11,
        }}
      />
      <Pressable onPress={save} style={{ backgroundColor: "#111827", borderRadius: 8, padding: 14 }}>
        <Text style={{ color: "#FFFFFF", fontWeight: "900", textAlign: "center" }}>Save Folder</Text>
      </Pressable>
    </View>
  );
}
