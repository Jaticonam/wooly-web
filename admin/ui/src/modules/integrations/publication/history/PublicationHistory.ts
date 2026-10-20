import fs from "node:fs/promises";
import path from "node:path";
import type { PublicationExecution, PublicationSnapshot } from "../models";

const HISTORY_DIR = path.resolve(process.cwd(), "ui/public/api/history/publications");
const INDEX_FILE = path.join(HISTORY_DIR, "index.json");

async function readIndex(): Promise<PublicationExecution[]> {
  try {
    const raw = await fs.readFile(INDEX_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function savePublicationHistory(execution: PublicationExecution, snapshot: PublicationSnapshot) {
  await fs.mkdir(HISTORY_DIR, { recursive: true });

  const executionFile = path.join(HISTORY_DIR, `${execution.id}.execution.json`);
  const snapshotFile = path.join(HISTORY_DIR, `${execution.id}.snapshot.json`);
  const latestFile = path.join(HISTORY_DIR, "latest.json");

  await fs.writeFile(executionFile, JSON.stringify(execution, null, 2), "utf8");
  await fs.writeFile(snapshotFile, JSON.stringify(snapshot, null, 2), "utf8");
  await fs.writeFile(latestFile, JSON.stringify({ execution, snapshot }, null, 2), "utf8");

  const history = await readIndex();
  const nextHistory = [execution, ...history.filter((item) => item.id !== execution.id)].slice(0, 100);
  await fs.writeFile(INDEX_FILE, JSON.stringify(nextHistory, null, 2), "utf8");

  return { executionFile, snapshotFile, latestFile, indexFile: INDEX_FILE };
}
