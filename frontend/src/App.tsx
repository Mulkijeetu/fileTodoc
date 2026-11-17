import { useEffect, useState, type FormEvent } from 'react';
import { listStudents, uploadStudentFile, type Student } from './api';
import './App.css';

const ACCEPTED = '.pdf,image/jpeg,image/png,image/gif,image/webp';

export default function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [freshId, setFreshId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listStudents()
      .then((rows) => {
        setStudents(rows);
        setLoadError('');
      })
      .catch((reason: unknown) => {
        setLoadError(reason instanceof Error ? reason.message : 'Could not load records.');
      })
      .finally(() => setLoading(false));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      setError('Choose a PDF or image first.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const saved = await uploadStudentFile(file);
      setStudents((current) => [saved, ...current.filter((row) => row.id !== saved.id)]);
      setFreshId(saved.id);
      setFile(null);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page">
      <header className="header">
        <h1>Student records</h1>
        <p>
          Upload a PDF or a photo of a student form. The server reads the file
          and stores the name, address, course, section, and grade.
        </p>
      </header>

      <form className="panel" onSubmit={onSubmit}>
        <label className="drop">
          <strong>PDF or image</strong>
          <span>JPEG, PNG, GIF, WebP, or PDF. Up to 10 MB.</span>
          <input
            type="file"
            accept={ACCEPTED}
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setError('');
            }}
          />
        </label>
        <div className="actions">
          <button type="submit" disabled={busy || !file}>
            {busy ? 'Reading file…' : 'Read and save'}
          </button>
          <span className="file-name">{file ? file.name : 'No file selected'}</span>
        </div>
        {error ? <p className="error">{error}</p> : null}
      </form>

      <section className="table-wrap" aria-live="polite">
        {loading ? (
          <p className="empty">Loading records…</p>
        ) : loadError ? (
          <p className="error">{loadError}</p>
        ) : students.length === 0 ? (
          <p className="empty">No records yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Student name</th>
                <th>Address</th>
                <th>Course</th>
                <th>Section</th>
                <th>Grade</th>
                <th>File</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className={student.id === freshId ? 'fresh' : undefined}>
                  <td>{student.studentName ?? '—'}</td>
                  <td>{student.address ?? '—'}</td>
                  <td>{student.course ?? '—'}</td>
                  <td>{student.section ?? '—'}</td>
                  <td>{student.grade ?? '—'}</td>
                  <td className="file">{student.sourceFileName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
