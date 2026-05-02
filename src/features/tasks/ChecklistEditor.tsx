import { Pressable, Text, TextInput, View } from "react-native";

export function ChecklistEditor({ items, onChange }: { items: string[]; onChange: (items: string[]) => void }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: "#111827", fontWeight: "800" }}>Checklist</Text>
      {items.map((item, index) => (
        <View key={index} style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            value={item}
            onChangeText={(text) => onChange(items.map((current, itemIndex) => (itemIndex === index ? text : current)))}
            placeholder="Checklist item"
            style={inputStyle}
          />
          <Pressable onPress={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} style={deleteButton}>
            <Text style={{ color: "#B91C1C", fontWeight: "800" }}>Remove</Text>
          </Pressable>
        </View>
      ))}
      <Pressable onPress={() => onChange([...items, ""])} style={addButton}>
        <Text style={{ color: "#2563EB", fontWeight: "800" }}>Add checklist item</Text>
      </Pressable>
    </View>
  );
}

const inputStyle = {
  backgroundColor: "#FFFFFF",
  borderColor: "#D1D5DB",
  borderRadius: 8,
  borderWidth: 1,
  flex: 1,
  paddingHorizontal: 12,
  paddingVertical: 10,
};

const deleteButton = {
  alignItems: "center" as const,
  justifyContent: "center" as const,
  paddingHorizontal: 8,
};

const addButton = {
  alignSelf: "flex-start" as const,
  paddingVertical: 8,
};
