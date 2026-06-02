import {
  deleteProgram,
  fetchAllPrograms,
  getDidaxisConfig,
} from "../.agents/skills/didaxis-program-deleter/support/delete-program";
import { PROGRAM_IDS_FILE } from "./cleanup-programs";
import * as fs from "node:fs/promises";
import * as path from "node:path";

async function globalSetup() {
  await fs.mkdir(path.dirname(PROGRAM_IDS_FILE), { recursive: true });
  await fs.writeFile(PROGRAM_IDS_FILE, "", "utf8");

  let cfg: { baseUrl: string; token: string };
  try {
    cfg = getDidaxisConfig();
  } catch (error) {
    console.warn(
      `[global-setup] Skipping AP_ pre-cleanup: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return;
  }

  const programs = await fetchAllPrograms(cfg.baseUrl, cfg.token);
  const targets = programs.filter((program) =>
    (program.name ?? "").startsWith("AP_"),
  );

  if (targets.length === 0) {
    console.log("[global-setup] No AP_ programs to clean.");
    return;
  }

  const failed: Array<{ id: string; status: number; message: string }> = [];
  for (const program of targets) {
    const result = await deleteProgram(cfg.baseUrl, cfg.token, program.id);
    if (!result.ok && result.status !== 404) {
      failed.push({ id: result.id, status: result.status, message: result.message });
    }
  }

  const cleaned = targets.length - failed.length;
  console.log(
    `[global-setup] AP_ pre-cleanup: tracked=${targets.length}, cleaned=${cleaned}, failed=${failed.length}`,
  );
  if (failed.length > 0) {
    console.warn(`[global-setup] Failed deletes: ${JSON.stringify(failed)}`);
  }
}

export default globalSetup;
