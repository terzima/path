jest.mock("expo-sqlite", () => ({ openDatabaseAsync: jest.fn() }));

import * as SQLite from "expo-sqlite";
import { getDatabase } from "../src/lib/db/database";

test("retries a failed database connection and shares a successful connection", async () => {
  const database = {} as SQLite.SQLiteDatabase;
  const open = jest.mocked(SQLite.openDatabaseAsync);
  open.mockRejectedValueOnce(new Error("Database unavailable")).mockResolvedValueOnce(database);

  const failed = getDatabase();
  expect(getDatabase()).toBe(failed);
  await expect(failed).rejects.toThrow("Database unavailable");

  const retried = getDatabase();
  expect(getDatabase()).toBe(retried);
  await expect(retried).resolves.toBe(database);
  expect(open).toHaveBeenCalledTimes(2);
  expect(open).toHaveBeenCalledWith("path.db");
});
