import { useEffect, useRef, useState, type FormEvent } from 'react';
import { reportDictationFocus, uploadStudentFile, type ReadStudent } from './api';
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

type TextField = 'studentName' | 'address' | 'course' | 'section' | 'grade' | 'sourceFileName';

type StudentForm = {
  studentName: string;
  address: string;
  course: string;
  section: string;
  grade: string;
  city: string;
  sourceFileName: string;
};

function isTextField(value: string): value is TextField {
  return (
    value === 'studentName' ||
    value === 'address' ||
    value === 'course' ||
    value === 'section' ||
    value === 'grade' ||
    value === 'sourceFileName'
  );
}

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
  const carets = useRef<Partial<Record<TextField, { start: number; end: number }>>>({});
  const caretRestore = useRef<{ field: TextField; pos: number } | null>(null);
  const blurTimer = useRef(0);
  const insertDictation = useRef<(field: TextField, text: string) => void>(() => {});
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState<StudentForm>(EMPTY_FORM);
  const [filled, setFilled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [phoneReady, setPhoneReady] = useState(false);

  function update(field: keyof StudentForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function rememberCaret(field: TextField) {
    const element = document.querySelector(`[data-dictate="${field}"]`);
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      carets.current[field] = {
        start: element.selectionStart ?? element.value.length,
        end: element.selectionEnd ?? element.value.length,
      };
    }
  }

  function boxProps(field: TextField) {
    return {
      'data-dictate': field,
      onFocus: () => {
        window.clearTimeout(blurTimer.current);
        rememberCaret(field);
        reportDictationFocus(field);
      },
      onBlur: () => {
        rememberCaret(field);
        window.clearTimeout(blurTimer.current);
        blurTimer.current = window.setTimeout(() => {
          const active = document.activeElement;
          if (active instanceof HTMLElement && active.dataset.dictate) return;
          reportDictationFocus(null);
        }, 120);
      },
      onSelect: () => rememberCaret(field),
      onKeyUp: () => rememberCaret(field),
      onClick: () => rememberCaret(field),
    };
  }

  insertDictation.current = (field, text) => {
    const element = document.querySelector(`[data-dictate="${field}"]`);
    const live =
      (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) &&
      document.activeElement === element
        ? { start: element.selectionStart ?? 0, end: element.selectionEnd ?? element.selectionStart ?? 0 }
        : null;
    setForm((current) => {
      const value = current[field];
      const caret = live ?? carets.current[field] ?? { start: value.length, end: value.length };
      const start = Math.min(caret.start, value.length);
      const end = Math.min(Math.max(caret.end, start), value.length);
      const next = value.slice(0, start) + text + value.slice(end);
      const pos = start + text.length;
      carets.current[field] = { start: pos, end: pos };
      caretRestore.current = { field, pos };
      return { ...current, [field]: next };
    });
  };

  useEffect(() => {
    const pending = caretRestore.current;
    if (!pending) return;
    caretRestore.current = null;
    const element = document.querySelector(`[data-dictate="${pending.field}"]`);
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      element.focus();
      element.setSelectionRange(pending.pos, pending.pos);
    }
  }, [form]);

  useEffect(() => {
    function onFocusIn(event: FocusEvent) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.dataset.dictate) return;
      if (target.closest('form')) reportDictationFocus(null);
    }
    document.addEventListener('focusin', onFocusIn);
    return () => document.removeEventListener('focusin', onFocusIn);
  }, []);

  useEffect(() => {
    const source = new EventSource('/api/dictate/stream');
    source.onopen = () => setPhoneReady(true);
    source.onerror = () => setPhoneReady(false);
    source.onmessage = (event) => {
      let payload: { kind?: string; field?: string; text?: string };
      try {
        payload = JSON.parse(event.data) as { kind?: string; field?: string; text?: string };
      } catch {
        return;
      }
      if (payload.kind !== 'text' || !payload.text || !payload.field || !isTextField(payload.field)) {
        return;
      }
      insertDictation.current(payload.field, payload.text);
    };
    return () => source.close();
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
          Click a text box, then send words from the <a href="/speak">phone speaker</a>.
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
            : 'These boxes fill in after you read a file, or from the phone speaker.'}
          {phoneReady ? ' The phone can type into the box that has the cursor.' : ''}
        </p>
        <label className="field">
          <span>Student name</span>
          <input
            value={form.studentName}
            onChange={(event) => update('studentName', event.target.value)}
            {...boxProps('studentName')}
          />
        </label>
        <label className="field">
          <span>Address</span>
          <textarea
            rows={4}
            value={form.address}
            onChange={(event) => update('address', event.target.value)}
            {...boxProps('address')}
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
            {...boxProps('course')}
          />
        </label>
        <div className="split">
          <label className="field">
            <span>Section</span>
            <input
              value={form.section}
              onChange={(event) => update('section', event.target.value)}
              {...boxProps('section')}
            />
          </label>
          <label className="field">
            <span>Grade</span>
            <input
              value={form.grade}
              onChange={(event) => update('grade', event.target.value)}
              {...boxProps('grade')}
            />
          </label>
        </div>
        <label className="field">
          <span>File</span>
          <input
            value={form.sourceFileName}
            onChange={(event) => update('sourceFileName', event.target.value)}
            {...boxProps('sourceFileName')}
          />
        </label>
      </form>
    </main>
  );
}
