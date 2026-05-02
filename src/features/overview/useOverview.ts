import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { addDays, todayKey } from "../../lib/dates";
import type { Folder, RecurringCompletion, Task } from "../../lib/types";
import { listFolders, listRecurringCompletions, listTasks } from "../../lib/db/queries";
import { isRecurringTaskDue, isRecurringTaskOverdue } from "../recurrence/recurrenceEngine";

export function useOverview() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [completions, setCompletions] = useState<RecurringCompletion[]>([]);
  const today = todayKey();
  const tomorrow = addDays(today, 1);

  const refresh = useCallback(async () => {
    const [nextTasks, nextFolders, nextCompletions] = await Promise.all([listTasks(), listFolders(), listRecurringCompletions()]);
    setTasks(nextTasks);
    setFolders(nextFolders);
    setCompletions(nextCompletions);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const folderIds = new Set(folders.map((folder) => folder.id));
  const activeTasks = tasks.filter((task) => task.status === "todo" && (!task.folderId || folderIds.has(task.folderId)));

  const overdue = activeTasks.filter((task) => {
    if (task.recurrenceType) return isRecurringTaskOverdue(task, today, completions);
    return task.scheduledDate < today;
  });
  const todayTasks = activeTasks.filter((task) => !task.recurrenceType && task.scheduledDate === today);
  const recurringDue = activeTasks.filter((task) => isRecurringTaskDue(task, today, completions));
  const tomorrowTasks = activeTasks.filter((task) => !task.recurrenceType && task.scheduledDate === tomorrow);
  const upcoming = activeTasks
    .filter((task) => !task.recurrenceType && task.scheduledDate > today)
    .slice(0, 12);
  const totalHours = [...todayTasks, ...recurringDue].reduce((sum, task) => sum + task.durationHours, 0);

  return { completions, overdue, recurringDue, refresh, tasks, today, todayTasks, tomorrow, tomorrowTasks, totalHours, upcoming };
}
