export type ReadStudent = {
  studentName: string | null;
  address: string | null;
  course: string | null;
  section: string | null;
  grade: string | null;
  city: string | null;
  sourceFileName: string;
};

export async function uploadStudentFile(file: File): Promise<ReadStudent> {
  const body = new FormData();
  body.append('file', file);
  const response = await fetch('/api/students/upload', {
    method: 'POST',
    body,
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json();
}

async function readError(response: Response): Promise<string> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return 'The API is not reachable. Start the API, then try again.';
  }
  try {
    const data = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(data.message)) return data.message.join(' ');
    if (typeof data.message === 'string') return data.message;
  } catch {
    // The body was not JSON.
  }
  return `Request failed (${response.status}).`;
}
