import * as dotenv from 'dotenv';

dotenv.config();

export type ProgramRecord = {
  id: string;
  name?: string;
};

export type DeleteProgramResult = {
  id: string;
  status: number;
  ok: boolean;
  message: string;
};

type ProgramsResponse = {
  data?: ProgramRecord[];
};

export function getDidaxisConfig() {
  const baseUrl = process.env.DIDAXIS_URL;
  const token = process.env.DIDAXIS_API_TOKEN;

  if (!baseUrl) {
    throw new Error('Missing DIDAXIS_URL in environment.');
  }
  if (!token) {
    throw new Error('Missing DIDAXIS_API_TOKEN in environment.');
  }

  return { baseUrl, token };
}

export async function fetchAllPrograms(
  baseUrl: string,
  token: string,
): Promise<ProgramRecord[]> {
  const response = await fetch(`${baseUrl}/api/programs`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GET /api/programs failed (${response.status}): ${body}`);
  }

  const payload = (await response.json()) as ProgramsResponse;
  return payload.data ?? [];
}

export async function deleteProgram(
  baseUrl: string,
  token: string,
  id: string,
): Promise<DeleteProgramResult> {
  const response = await fetch(`${baseUrl}/api/programs/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  const body = await response.text();
  return {
    id,
    status: response.status,
    ok: response.ok,
    message: body,
  };
}
