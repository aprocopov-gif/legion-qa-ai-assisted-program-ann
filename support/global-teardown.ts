import {
  deleteProgram,
  fetchAllPrograms,
  getDidaxisConfig,
} from '../.agents/skills/didaxis-program-deleter/support/delete-program';
import { cleanupProgramsFromFile } from './cleanup-programs';

async function globalTeardown() {
  await cleanupProgramsFromFile();

  let cfg: { baseUrl: string; token: string };
  try {
    cfg = getDidaxisConfig();
  } catch (error) {
    console.warn(
      `[global-teardown] Skipping AP_ cleanup: ${error instanceof Error ? error.message : String(error)}`,
    );
    return;
  }

  const programs = await fetchAllPrograms(cfg.baseUrl, cfg.token);
  const targets = programs.filter((program) =>
    (program.name ?? '').startsWith('AP_'),
  );

  if (targets.length === 0) {
    console.log('[global-teardown] No AP_ programs to clean.');
    return;
  }

  const failed: Array<{ id: string; status: number; message: string }> = [];
  for (const program of targets) {
    const result = await deleteProgram(cfg.baseUrl, cfg.token, program.id);
    if (!result.ok && result.status !== 404) {
      failed.push({
        id: result.id,
        status: result.status,
        message: result.message,
      });
    }
  }

  const cleaned = targets.length - failed.length;
  console.log(
    `[global-teardown] AP_ cleanup: tracked=${targets.length}, cleaned=${cleaned}, failed=${failed.length}`,
  );
  if (failed.length > 0) {
    console.warn(`[global-teardown] Failed deletes: ${JSON.stringify(failed)}`);
  }
}

export default globalTeardown;
