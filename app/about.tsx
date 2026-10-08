import Constants from "expo-constants";
import { Alert, Linking, Pressable, ScrollView, Text, View } from "react-native";

const sections = [
  ["Your data stays on your device", "Path stores your folders, tasks, notes, checklists, schedules, and completion history locally on your device. Path has no account system or server sync."],
  ["Data collection", "Path does not send your task data to the developer. The app does not include advertising, analytics, or tracking services."],
  ["Importing and sharing", "CSV import reads only the file you select using the system file picker. Backup creates a JSON file and opens the system share sheet. Your chosen destination may receive that file under its own privacy policy. Imported files and exported backups may remain in the app’s temporary storage until cleared by the system."],
  ["Removing your data", "You can delete tasks and project folders in the app. Deleting the app, rather than offloading it, removes its local data. Files you previously exported remain wherever you saved or shared them. Device backups are managed separately by Apple and your device settings."],
  ["Backup limitations", "Backup currently exports folders, tasks, and recurring completion history. It does not include checklist items, and Path cannot restore a backup file yet. Keep original CSV files if you need to import a plan again."],
  ["Support", "If you contact us by email, we use the information you choose to send to respond and resolve your request. Please avoid including sensitive task data unless it is needed to investigate your issue."],
  ["Policy updates", "This policy applies to Path 1.0.0 and was updated on October 8, 2026. Any changes to how Path handles data will be reflected here in a future app update."],
];

export default function AboutScreen() {
  const privacyPolicyUrl = Constants.expoConfig?.extra?.privacyPolicyUrl as string | undefined;
  const supportEmail = Constants.expoConfig?.extra?.supportEmail as string | undefined;

  async function openLink(url: string) {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Unable to open link", "Please try again with a browser or email app available on your device.");
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F3F4F6" }} contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
      <Text style={{ color: "#111827", fontSize: 32, fontWeight: "900" }}>Path</Text>
      <Text style={{ color: "#4B5563", marginTop: 4 }}>Version {Constants.expoConfig?.version ?? "1.0.0"}</Text>
      <Text style={{ color: "#111827", marginTop: 12, lineHeight: 22 }}>Turn your plans into dated work blocks, organize projects, and keep track of what comes next.</Text>
      <Text accessibilityRole="header" style={{ color: "#111827", fontSize: 24, fontWeight: "800", marginTop: 24 }}>Privacy Policy</Text>
      {sections.map(([title, body]) => (
        <View key={title} style={{ marginTop: 20 }}>
          <Text accessibilityRole="header" style={{ color: "#111827", fontSize: 18, fontWeight: "700" }}>{title}</Text>
          <Text style={{ color: "#374151", lineHeight: 23, marginTop: 6 }}>{body}</Text>
        </View>
      ))}
      {privacyPolicyUrl ? (
        <Pressable accessibilityRole="link" onPress={() => openLink(privacyPolicyUrl)} style={{ marginTop: 24, paddingVertical: 12 }}>
          <Text style={{ color: "#075985", fontWeight: "700" }}>View privacy policy online</Text>
        </Pressable>
      ) : null}
      {supportEmail ? (
        <Pressable accessibilityRole="link" onPress={() => openLink(`mailto:${supportEmail}?subject=Path%20support`)} style={{ marginTop: 12, paddingVertical: 12 }}>
          <Text style={{ color: "#075985", fontWeight: "700" }}>Support: {supportEmail}</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}
