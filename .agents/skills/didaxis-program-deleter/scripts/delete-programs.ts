import {
  deleteProgram,
  fetchAllPrograms,
  getDidaxisConfig,
  type DeleteProgramResult,
} from "../support/delete-program";

type CliArgs = {
  dryRun: boolean;
  ids: string[];
};

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    dryRun: false,
    ids: [],
  };

  for (let index = 0; index < argv.length; index++) {
    const value = argv[index];
    if (value === "--dry-run") {
      args.dryRun = true;
      continue;
    }

    if (value === "--id") {
      const id = argv[index + 1];
      if (!id) {
        throw new Error("Missing value after --id");
      }
      args.ids.push(id);
      index += 1;
      continue;
    }
  }

  return args;
}

function printSummary(scope: string, found: number, deleted: string[], failed: DeleteProgramResult[]) {
  console.log(`**Scope:** ${scope}`);
  console.log(`**Found via GET:** ${found}`);
  console.log(`**Deleted:** ${deleted.length > 0 ? deleted.join(", ") : "none"}`);
  if (failed.length === 0) {
    console.log("**Failed:** none");
  } else {
    const failures = failed.map((item) => `${item.id} (${item.status}) ${item.message}`).join(" | ");
    console.log(`**Failed:** ${failures}`);
  }
}

async function main() {
  const { dryRun, ids } = parseArgs(process.argv.slice(2));
  const { baseUrl, token } = getDidaxisConfig();

  const allPrograms = await fetchAllPrograms(baseUrl, token);
  const allIds = allPrograms.map((program) => program.id);
  const targetIds = ids.length > 0 ? ids : allIds;
  const scope = ids.length > 0 ? "specific UUID(s)" : "all programs";

  if (dryRun) {
    printSummary(scope, allIds.length, targetIds, []);
    return;
  }

  const deleted: string[] = [];
  const failed: DeleteProgramResult[] = [];

  for (const id of targetIds) {
    const result = await deleteProgram(baseUrl, token, id);
    if (result.ok || result.status === 404) {
      deleted.push(id);
      continue;
    }
    failed.push(result);
  }

  printSummary(scope, allIds.length, deleted, failed);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
