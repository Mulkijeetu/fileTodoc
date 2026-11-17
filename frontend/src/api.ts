export type Student = {
  id: number;
  studentName: string | null;
  address: string | null;
  course: string | null;
  section: string | null;
  grade: string | null;
  sourceFileName: string;
  createdAt: string;
};

export async function listStudents(): Promise<Student[]> {
  const response = await fetch('/api/students');
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json();
}

export async function uploadStudentFile(file: File): Promise<Student> {
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
    return 'The API is not reachable. Start MySQL, then run npm run dev:api.';
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
