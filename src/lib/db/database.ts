import * as SQLite from "expo-sqlite";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync("path.db").catch((error) => {
      dbPromise = null;
      throw error;
    });
  }
  return dbPromise;
}
