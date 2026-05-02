import { Text, View } from "react-native";

export function EmptyState({ title }: { title: string }) {
  return (
    <View style={{ alignItems: "center", padding: 24 }}>
      <Text style={{ color: "#6B7280", fontSize: 15 }}>{title}</Text>
    </View>
  );
}
