import { expect, request, test as base } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

type CleanupFixtures = {
  trackProgram: (uuid: string) => void;
};

type DeleteResult = {
  id: string;
  status: number;
  body: string;
};

const PROGRAM_IDS_FILE = path.join(
  'playwright',
  '.tmp',
  'created-program-ids.txt',
);

const test = base.extend<{}, CleanupFixtures>({
  trackProgram: [
    async ({}, use) => {
      const trackedIds = new Set<string>();

      await use((uuid: string) => {
        const normalized = uuid.trim();
        if (normalized.length > 0 && !trackedIds.has(normalized)) {
          trackedIds.add(normalized);
          try {
            fs.mkdirSync(path.dirname(PROGRAM_IDS_FILE), { recursive: true });
            fs.appendFileSync(PROGRAM_IDS_FILE, `${normalized}\n`, 'utf8');
          } catch (error) {
            console.warn(
              `[cleanup.fixture] Failed to write program ID to file: ${
                error instanceof Error ? error.message : String(error)
              }`,
            );
          }
        }
      });

      if (trackedIds.size === 0) {
        return;
      }

      const baseUrl = process.env.DIDAXIS_URL;
      const token = process.env.DIDAXIS_API_TOKEN;
      if (!baseUrl || !token) {
        console.warn(
          '[cleanup.fixture] Skipping cleanup: missing DIDAXIS_URL or DIDAXIS_API_TOKEN.',
        );
        return;
      }

      const api = await request.newContext({
        baseURL: baseUrl,
        extraHTTPHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });

      const deleted: string[] = [];
      const failed: DeleteResult[] = [];
      for (const id of trackedIds) {
        const response = await api.delete(`/api/programs/${id}`);
        if (response.ok() || response.status() === 404) {
          deleted.push(id);
        } else {
          failed.push({
            id,
            status: response.status(),
            body: await response.text(),
          });
        }
      }

      await api.dispose();

      console.log(
        `[cleanup.fixture] Tracked ${trackedIds.size} program(s). Cleaned ${deleted.length}.`,
      );

      if (failed.length > 0) {
        console.warn(
          `[cleanup.fixture] Failed deletes: ${JSON.stringify(failed)}`,
        );
      }
    },
    { scope: 'worker' },
  ],
});

export { expect, test };
export type { CleanupFixtures };
