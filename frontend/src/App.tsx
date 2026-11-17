import { useRef, useState, type FormEvent } from 'react';
import { uploadStudentFile, type ReadStudent } from './api';
import './App.css';

const ACCEPTED = '.pdf,image/jpeg,image/png,image/gif,image/webp';
const CITY_NONE = 'none';
const CITIES = [
  'Mumbai',
  'Delhi',
  'Bengaluru',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Ahmedabad',
  'Jaipur',
  'Kochi',
];

type StudentForm = {
  studentName: string;
  address: string;
  course: string;
  section: string;
  grade: string;
  city: string;
  sourceFileName: string;
};

const EMPTY_FORM: StudentForm = {
  studentName: '',
  address: '',
  course: '',
  section: '',
  grade: '',
  city: CITY_NONE,
  sourceFileName: '',
};

function cityValue(value: string | null | undefined): string {
  const match = CITIES.find((city) => city.toLowerCase() === value?.trim().toLowerCase());
  return match ?? CITY_NONE;
}

function toForm(student: ReadStudent): StudentForm {
  return {
    studentName: student.studentName ?? '',
    address: student.address ?? '',
    course: student.course ?? '',
    section: student.section ?? '',
    grade: student.grade ?? '',
    city: cityValue(student.city),
    sourceFileName: student.sourceFileName ?? '',
  };
}

export default function App() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState<StudentForm>(EMPTY_FORM);
  const [filled, setFilled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function update(field: keyof StudentForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      setError('Choose a PDF or image first.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const read = await uploadStudentFile(file);
      setForm(toForm(read));
      setFilled(true);
      setFile(null);
      if (fileInput.current) fileInput.current.value = '';
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
          and fills the name, address, city, course, section, and grade below.
        </p>
      </header>

      <form className="panel" onSubmit={onSubmit}>
        <label className="drop">
          <strong>PDF or image</strong>
          <span>JPEG, PNG, GIF, WebP, or PDF. Up to 10 MB.</span>
          <input
            ref={fileInput}
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
            {busy ? 'Reading file…' : 'Read file'}
          </button>
          <span className="file-name">{file ? file.name : 'No file selected'}</span>
        </div>
        {error ? <p className="error">{error}</p> : null}
      </form>

      <form className="panel details" onSubmit={(event) => event.preventDefault()}>
        <h2>Student details</h2>
        <p className="hint">
          {filled
            ? 'Values read from the file. You can edit them here. Nothing is saved.'
            : 'These boxes fill in after you read a file.'}
        </p>
        <label className="field">
          <span>Student name</span>
          <input
            value={form.studentName}
            onChange={(event) => update('studentName', event.target.value)}
          />
        </label>
        <label className="field">
          <span>Address</span>
          <textarea
            rows={4}
            value={form.address}
            onChange={(event) => update('address', event.target.value)}
          />
        </label>
        <label className="field">
          <span>City</span>
          <select value={form.city} onChange={(event) => update('city', event.target.value)}>
            <option value={CITY_NONE}>{CITY_NONE}</option>
            {CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Course</span>
          <input
            value={form.course}
            onChange={(event) => update('course', event.target.value)}
          />
        </label>
        <div className="split">
          <label className="field">
            <span>Section</span>
            <input
              value={form.section}
              onChange={(event) => update('section', event.target.value)}
            />
          </label>
          <label className="field">
            <span>Grade</span>
            <input
              value={form.grade}
              onChange={(event) => update('grade', event.target.value)}
            />
          </label>
        </div>
        <label className="field">
          <span>File</span>
          <input
            value={form.sourceFileName}
            onChange={(event) => update('sourceFileName', event.target.value)}
          />
        </label>
      </form>
    </main>
  );
}
