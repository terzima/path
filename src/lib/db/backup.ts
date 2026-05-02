import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { listFolders, listRecurringCompletions, listTasks } from "./queries";

export async function exportBackup() {
  const payload = {
    exportedAt: new Date().toISOString(),
    folders: await listFolders(),
    tasks: await listTasks(),
    recurringCompletions: await listRecurringCompletions(),
  };
  const file = new File(Paths.cache, "path-backup.json");
  file.write(JSON.stringify(payload, null, 2));
  await Sharing.shareAsync(file.uri);
}
