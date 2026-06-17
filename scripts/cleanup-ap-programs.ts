import * as dotenv from 'dotenv';
import * as os from 'node:os';
import * as path from 'node:path';

dotenv.config();

if (
  process.platform === 'darwin' &&
  (!process.env.PLAYWRIGHT_BROWSERS_PATH ||
    process.env.PLAYWRIGHT_BROWSERS_PATH.includes('cursor-sandbox-cache'))
) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = path.join(
    os.homedir(),
    'Library/Caches/ms-playwright',
  );
}

import { chromium, type Page } from '@playwright/test';

const BASE_URL = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

type ProgramRow = { name: string; description: string };

async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page
    .getByRole('textbox', { name: 'Email' })
    .fill(process.env.DIDAXIS_EMAIL!);
  await page
    .getByRole('textbox', { name: 'Password' })
    .fill(process.env.DIDAXIS_PASSWORD!);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL(`${BASE_URL}/`);
}

async function listApPrograms(page: Page): Promise<ProgramRow[]> {
  await page.goto(`${BASE_URL}/programs`);
  await page
    .getByRole('table')
    .waitFor({ state: 'visible', timeout: 15_000 })
    .catch(() => {});

  const rows = page.getByRole('row').filter({ has: page.getByText(/^AP_/) });
  const count = await rows.count();
  const programs: ProgramRow[] = [];

  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    const cell = row.getByRole('cell').first();
    const lines = ((await cell.innerText()) ?? '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const name = lines[0] ?? '';
    if (!name.startsWith('AP_')) continue;

    const description = lines.slice(1).join('\n');
    programs.push({ name, description });
  }

  return programs;
}

async function deleteProgram(page: Page, programName: string): Promise<void> {
  await page.goto(`${BASE_URL}/programs`);
  page.once('dialog', (dialog) => dialog.accept());
  await page
    .getByRole('row', { name: new RegExp(esc(programName)) })
    .first()
    .getByRole('button', { name: new RegExp(`Delete ${esc(programName)}`) })
    .click();
  await page
    .getByRole('row', { name: new RegExp(esc(programName)) })
    .first()
    .waitFor({ state: 'hidden', timeout: 10_000 });
}

function printTable(programs: ProgramRow[]) {
  const idxW = String(Math.max(programs.length, 1)).length;
  const nameW = Math.max(
    12,
    ...programs.map((p) => p.name.length),
    'Program Name'.length,
  );
  const descW = Math.max(
    11,
    ...programs.map((p) => p.description.length),
    'Description'.length,
  );

  const pad = (s: string, w: number) => s.padEnd(w).slice(0, w);
  const sep = `+-${'-'.repeat(idxW)}-+-${'-'.repeat(nameW)}-+-${'-'.repeat(descW)}-+`;

  console.log(sep);
  console.log(
    `| ${pad('#', idxW)} | ${pad('Program Name', nameW)} | ${pad('Description', descW)} |`,
  );
  console.log(sep);
  programs.forEach((p, i) => {
    console.log(
      `| ${pad(String(i + 1), idxW)} | ${pad(p.name, nameW)} | ${pad(p.description || '—', descW)} |`,
    );
  });
  console.log(sep);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await login(page);
    let programs = await listApPrograms(page);

    if (programs.length === 0) {
      console.log('\nNo AP_ programs found on Didaxis.\n');
      return;
    }

    console.log(`\nFound ${programs.length} AP_ program(s):\n`);
    printTable(programs);

    const deleted: string[] = [];
    const failed: { name: string; error: string }[] = [];

    for (const { name } of [...programs]) {
      try {
        await deleteProgram(page, name);
        deleted.push(name);
      } catch (err) {
        failed.push({
          name,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    programs = await listApPrograms(page);

    console.log('\n## Cleanup summary\n');
    console.log(`- Matched (AP_): ${deleted.length + failed.length}`);
    console.log(`- Deleted: ${deleted.length}`);
    console.log(`- Failed: ${failed.length}`);
    console.log(`- Remaining AP_ rows: ${programs.length}`);

    if (failed.length > 0) {
      console.log('\n### Failures');
      for (const f of failed) {
        console.log(`- ${f.name}: ${f.error}`);
      }
    }

    if (programs.length > 0) {
      console.log('\n### Remaining AP_ programs\n');
      printTable(programs);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
