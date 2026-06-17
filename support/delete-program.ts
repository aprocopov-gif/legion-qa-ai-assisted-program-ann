import dotenv from 'dotenv';

dotenv.config();

export type DidaxisProgram = {
  id: string;
  name: string;
};

export type DeleteProgramResult = {
  id: string;
  ok: boolean;
  status: number;
  message: string;
};

type ProgramsListResponse = {
  data?: Array<{ id?: unknown; name?: unknown }>;
};

type CreateProgramResponse = {
  data?: { id?: unknown };
};

function getConfig(): { token: string; baseUrl: string } | null {
  const token = process.env.DIDAXIS_API_TOKEN;
  const baseUrl = process.env.DIDAXIS_URL;

  if (!token || !baseUrl) {
    return null;
  }

  return { token, baseUrl };
}

export async function getAllPrograms(): Promise<DidaxisProgram[]> {
  const config = getConfig();
  if (!config) {
    throw new Error('DIDAXIS_API_TOKEN or DIDAXIS_URL is not set in .env');
  }

  const response = await fetch(`${config.baseUrl}/api/programs`, {
    headers: {
      Authorization: `Bearer ${config.token}`,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to fetch programs: ${response.status} ${body}`);
  }

  const body = (await response.json()) as ProgramsListResponse;
  const programs = body.data;

  if (!Array.isArray(programs)) {
    throw new Error('Unexpected GET /api/programs response shape');
  }

  return programs
    .filter((program): program is DidaxisProgram => typeof program?.id === 'string')
    .map((program) => ({
      id: program.id,
      name: typeof program.name === 'string' ? program.name : program.id,
    }));
}

export async function getAllProgramIds(): Promise<string[]> {
  const programs = await getAllPrograms();
  return programs.map((program) => program.id);
}

export async function deleteProgramById(id: string): Promise<DeleteProgramResult> {
  const config = getConfig();
  if (!config) {
    return {
      id,
      ok: false,
      status: 0,
      message: 'DIDAXIS_API_TOKEN or DIDAXIS_URL is not set in .env',
    };
  }

  const response = await fetch(`${config.baseUrl}/api/programs/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${config.token}`,
    },
  });

  const body = await response.text();

  return {
    id,
    ok: response.ok,
    status: response.status,
    message: body,
  };
}

export async function deleteProgramsByIds(ids: string[]): Promise<DeleteProgramResult[]> {
  const results: DeleteProgramResult[] = [];

  for (const id of ids) {
    results.push(await deleteProgramById(id));
  }

  return results;
}

export async function deleteAllPrograms(): Promise<DeleteProgramResult[]> {
  const programIds = await getAllProgramIds();

  if (programIds.length === 0) {
    return [];
  }

  return deleteProgramsByIds(programIds);
}

export async function createProgramViaApi(
  name: string,
  description: string,
): Promise<string> {
  const config = getConfig();
  if (!config) {
    throw new Error('DIDAXIS_API_TOKEN or DIDAXIS_URL is not set in .env');
  }

  const response = await fetch(`${config.baseUrl}/api/programs`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, description }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to create program: ${response.status} ${body}`);
  }

  const body = (await response.json()) as CreateProgramResponse;
  const id = body.data?.id;

  if (typeof id !== 'string' || id.length === 0) {
    throw new Error('Unexpected POST /api/programs response shape');
  }

  return id;
}