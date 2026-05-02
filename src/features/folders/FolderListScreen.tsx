import { Link, router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { EmptyState } from "../../components/EmptyState";
import { exportBackup } from "../../lib/db/backup";
import { deleteFolder, listFolders } from "../../lib/db/queries";
import type { Folder } from "../../lib/types";

export function FolderListScreen() {
  const [folders, setFolders] = useState<Folder[]>([]);

  const refresh = useCallback(async () => {
    setFolders(await listFolders());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  function confirmDeleteFolder(folder: Folder) {
    if (folder.id === "general") {
      Alert.alert("General stays", "General is the default folder and cannot be deleted.");
      return;
    }
    Alert.alert(
      `Delete "${folder.name}"?`,
      "This will permanently delete the folder and all tasks inside it.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteFolder(folder.id);
            await refresh();
          },
        },
      ],
    );
  }

  return (
    <ScrollView style={{ backgroundColor: "#F3F4F6", flex: 1 }} contentContainerStyle={{ paddingBottom: 140 }}>
      <View style={{ padding: 18, paddingTop: 24 }}>
        <Text style={{ color: "#111827", fontSize: 32, fontWeight: "900" }}>Folders</Text>
        <Text style={{ color: "#4B5563", marginTop: 4 }}>Project-specific planning and recovery.</Text>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
          <Pressable onPress={() => router.push("/modals/folder")} style={primaryButton}>
            <Text style={primaryText}>Add Folder</Text>
          </Pressable>
          <Pressable onPress={exportBackup} style={secondaryButton}>
            <Text style={secondaryText}>Backup</Text>
          </Pressable>
        </View>
      </View>

      {folders.length === 0 ? <EmptyState title="No folders yet" /> : null}
      {folders.map((folder) => (
        <View
          key={folder.id}
          style={{
            alignItems: "center",
            backgroundColor: "#FFFFFF",
            borderBottomColor: "#E5E7EB",
            borderBottomWidth: 1,
            flexDirection: "row",
            gap: 12,
            padding: 18,
          }}
        >
          <Link href={`/folders/${folder.id}`} asChild>
            <Pressable style={{ flex: 1 }}>
              <Text style={{ color: "#111827", fontSize: 18, fontWeight: "800" }}>{folder.name}</Text>
            </Pressable>
          </Link>
          <Pressable onPress={() => confirmDeleteFolder(folder)} hitSlop={10}>
            <Text style={{ color: "#B91C1C", fontWeight: "800" }}>Delete</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const primaryButton = { backgroundColor: "#111827", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 };
const primaryText = { color: "#FFFFFF", fontWeight: "800" as const };
const secondaryButton = { backgroundColor: "#E5E7EB", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 };
const secondaryText = { color: "#111827", fontWeight: "800" as const };
