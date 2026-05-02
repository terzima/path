import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { parseCsvToDrafts } from "./csvParser";

export async function pickCsvDrafts() {
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    type: ["text/csv", "text/comma-separated-values", "application/vnd.ms-excel"],
  });
  if (result.canceled) return [];
  const file = result.assets[0];
  const contents = await new File(file.uri).text();
  return parseCsvToDrafts(contents);
}
