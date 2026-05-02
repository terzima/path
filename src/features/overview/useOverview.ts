import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { addDays, todayKey } from "../../lib/dates";
import type { RecurringCompletion, Task } from "../../lib/types";
import { listRecurringCompletions, listTasks } from "../../lib/db/queries";
import { isRecurringTaskDue, isRecurringTaskOverdue } from "../recurrence/recurrenceEngine";

export function useOverview() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<RecurringCompletion[]>([]);
  const today = todayKey();
  const tomorrow = addDays(today, 1);

  const refresh = useCallback(async () => {
    const [nextTasks, nextCompletions] = await Promise.all([listTasks(), listRecurringCompletions()]);
    setTasks(nextTasks);
    setCompletions(nextCompletions);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const overdue = tasks.filter((task) => {
    if (task.status !== "todo") return false;
    if (task.recurrenceType) return isRecurringTaskOverdue(task, today, completions);
    return task.scheduledDate < today;
  });
  const todayTasks = tasks.filter((task) => !task.recurrenceType && task.status === "todo" && task.scheduledDate === today);
  const recurringDue = tasks.filter((task) => isRecurringTaskDue(task, today, completions));
  const tomorrowTasks = tasks.filter((task) => !task.recurrenceType && task.status === "todo" && task.scheduledDate === tomorrow);
  const upcoming = tasks
    .filter((task) => !task.recurrenceType && task.status === "todo" && task.scheduledDate > today)
    .slice(0, 12);
  const totalHours = [...todayTasks, ...recurringDue].reduce((sum, task) => sum + task.durationHours, 0);

  return { completions, overdue, recurringDue, refresh, tasks, today, todayTasks, tomorrow, tomorrowTasks, totalHours, upcoming };
}
