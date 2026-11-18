import { useRef, useState } from 'react';
import { sendDictation } from './api';
import { createSpeechRecognition, type BrowserSpeechRecognition } from './speech';
import './App.css';

export default function Speak() {
  const recognition = useRef<BrowserSpeechRecognition | null>(null);
  const baseText = useRef('');
  const [draft, setDraft] = useState('');
  const [listening, setListening] = useState(false);
  const [supported] = useState(() => createSpeechRecognition() !== null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  function stopListening() {
    const current = recognition.current;
    recognition.current = null;
    setListening(false);
    try {
      current?.stop();
    } catch {
      // The recognizer had already stopped.
    }
  }

  function startListening() {
    const next = createSpeechRecognition();
    if (!next) {
      setError('This browser cannot hear speech. Open this page in Chrome.');
      return;
    }

    baseText.current = draft.trim() ? `${draft.trim()} ` : '';
    next.onresult = (event) => {
      let finalText = '';
      let interim = '';
      for (let index = 0; index < event.results.length; index += 1) {
        const piece = event.results[index][0].transcript;
        if (event.results[index].isFinal) finalText += piece;
        else interim += piece;
      }
      setDraft(`${baseText.current}${finalText}${interim}`);
    };
    next.onerror = (event) => {
      if (event.error === 'aborted' || event.error === 'no-speech') return;
      if (event.error === 'not-allowed') {
        setError('Allow the microphone, then press the speaker again.');
      } else {
        setError('The microphone stopped. Press the speaker to try again.');
      }
      stopListening();
    };
    next.onend = () => setListening(false);

    recognition.current = next;
    setError('');
    setNotice('');
    try {
      next.start();
      setListening(true);
    } catch {
      setError('The microphone is already in use.');
      recognition.current = null;
    }
  }

  function toggleListening() {
    if (listening) stopListening();
    else startListening();
  }

  async function onSend() {
    const text = draft.trim();
    if (!text) {
      setError('Say something before sending.');
      return;
    }
    stopListening();
    setSending(true);
    setError('');
    setNotice('');
    try {
      await sendDictation(text);
      setDraft('');
      baseText.current = '';
      setNotice('Typed on the desktop.');
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'Send failed.');
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="page speak-page">
      <header className="header">
        <h1>Speaker</h1>
        <p>
          Press the speaker, say the words, then press Send. They are typed into
          the text box that has the cursor on the desktop form.
        </p>
      </header>

      <section className="panel speak-panel">
        <button
          type="button"
          className={listening ? 'speaker live' : 'speaker'}
          aria-pressed={listening}
          aria-label={listening ? 'Stop speaking' : 'Start speaking'}
          disabled={!supported || sending}
          onClick={toggleListening}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4.03v8.05A4.5 4.5 0 0 0 16.5 12zM14 3.23v2.06a7 7 0 0 1 0 13.42v2.06a9 9 0 0 0 0-17.54z"
            />
          </svg>
        </button>
        <p className="hint">{listening ? 'Listening…' : 'Speaker is off.'}</p>
        {!supported ? (
          <p className="error">This browser cannot hear speech. Open this page in Chrome.</p>
        ) : null}
        <label className="field">
          <span>Words to send</span>
          <textarea
            rows={5}
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setNotice('');
            }}
          />
        </label>
        <div className="actions">
          <button type="button" onClick={onSend} disabled={sending || !draft.trim()}>
            {sending ? 'Sending…' : 'Send'}
          </button>
          <a href="/">Desktop form</a>
        </div>
        {error ? <p className="error">{error}</p> : null}
        {notice ? <p className="note">{notice}</p> : null}
      </section>
    </main>
  );
}
