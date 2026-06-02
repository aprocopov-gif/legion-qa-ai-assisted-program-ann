import * as fs from "node:fs/promises";
import * as path from "node:path";

import {
  deleteProgram,
  getDidaxisConfig,
} from "../.agents/skills/didaxis-program-deleter/support/delete-program";

const PROGRAM_IDS_FILE = path.join("playwright", ".tmp", "created-program-ids.txt");

type CleanupSummary = {
  tracked: number;
  cleaned: number;
  failed: number;
};

export async function cleanupProgramsFromFile(
  idsFilePath = PROGRAM_IDS_FILE,
): Promise<CleanupSummary> {
  let rawIds = "";
  try {
    rawIds = await fs.readFile(idsFilePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      console.log("[cleanup-programs] No created program IDs file found.");
      return { tracked: 0, cleaned: 0, failed: 0 };
    }
    throw error;
  }

  const ids = [...new Set(rawIds.split(/\r?\n/).map((line) => line.trim()).filter(Boolean))];
  if (ids.length === 0) {
    console.log("[cleanup-programs] Program IDs file is empty. Nothing to clean.");
    return { tracked: 0, cleaned: 0, failed: 0 };
  }

  let cfg: { baseUrl: string; token: string };
  try {
    cfg = getDidaxisConfig();
  } catch (error) {
    console.warn(
      `[cleanup-programs] Skipping cleanup from IDs file: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return { tracked: ids.length, cleaned: 0, failed: ids.length };
  }

  const failed: Array<{ id: string; status: number; message: string }> = [];
  for (const id of ids) {
    const result = await deleteProgram(cfg.baseUrl, cfg.token, id);
    if (!result.ok && result.status !== 404) {
      failed.push({
        id: result.id,
        status: result.status,
        message: result.message,
      });
    }
  }

  await fs.mkdir(path.dirname(idsFilePath), { recursive: true });
  await fs.writeFile(idsFilePath, "", "utf8");

  const cleaned = ids.length - failed.length;
  console.log(
    `[cleanup-programs] Cleanup from file: tracked=${ids.length}, cleaned=${cleaned}, failed=${failed.length}`,
  );
  if (failed.length > 0) {
    console.warn(`[cleanup-programs] Failed deletes: ${JSON.stringify(failed)}`);
  }

  return { tracked: ids.length, cleaned, failed: failed.length };
}

export { PROGRAM_IDS_FILE };
