import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { migrate } from "../src/lib/db/migrations";

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setFailed(false);
    migrate().then(
      () => { if (active) setReady(true); },
      () => { if (active) setFailed(true); },
    );
    return () => { active = false; };
  }, [attempt]);

  if (failed) {
    return (
      <View style={{ alignItems: "center", flex: 1, justifyContent: "center", padding: 24, gap: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: "700" }}>Path couldn’t open your data</Text>
        <Text style={{ textAlign: "center" }}>Please try again. If this continues, restart the app.</Text>
        <Pressable accessibilityRole="button" onPress={() => setAttempt((value) => value + 1)}
          style={{ backgroundColor: "#111827", borderRadius: 8, padding: 14 }}>
          <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>Try again</Text>
        </Pressable>
      </View>
    );
  }

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
      <Stack.Screen name="about" options={{ title: "Privacy & About" }} />
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
