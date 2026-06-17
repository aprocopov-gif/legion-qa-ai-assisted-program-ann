import { cleanupProgramsFromFile } from './cleanup-programs';

export default async function globalTeardown(): Promise<void> {
  await cleanupProgramsFromFile();
}