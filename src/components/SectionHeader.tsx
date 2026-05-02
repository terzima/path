import { Text, View } from "react-native";

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ paddingHorizontal: 18, paddingTop: 22, paddingBottom: 8 }}>
      <Text style={{ color: "#111827", fontSize: 18, fontWeight: "800" }}>{title}</Text>
      {subtitle ? <Text style={{ color: "#6B7280", marginTop: 2 }}>{subtitle}</Text> : null}
    </View>
  );
}
