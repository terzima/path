import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { migrate } from "../src/lib/db/migrations";

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    migrate().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={{ alignItems: "center", flex: 1, justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Overview" }} />
      <Stack.Screen name="upcoming" options={{ title: "Upcoming" }} />
      <Stack.Screen name="folders/index" options={{ title: "Folders" }} />
      <Stack.Screen name="folders/[folderId]" options={{ title: "Folder" }} />
      <Stack.Screen name="folders/[folderId]/archive" options={{ title: "Archive" }} />
      <Stack.Screen name="modals/task" options={{ presentation: "modal", title: "Task" }} />
      <Stack.Screen name="modals/folder" options={{ presentation: "modal", title: "Folder" }} />
      <Stack.Screen name="modals/import" options={{ presentation: "modal", title: "Import" }} />
      <Stack.Screen name="modals/bulk-shift" options={{ presentation: "modal", title: "Bulk Shift" }} />
    </Stack>
  );
}
