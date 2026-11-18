export type SpeechResultList = {
  length: number;
  [index: number]: {
    isFinal: boolean;
    0: { transcript: string };
  };
};

export type SpeechRecognitionEvent = Event & {
  results: SpeechResultList;
};

export type SpeechRecognitionErrorEvent = Event & {
  error: string;
};

export type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
};

type SpeechWindow = Window & {
  SpeechRecognition?: new () => BrowserSpeechRecognition;
  webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
};

export function createSpeechRecognition(): BrowserSpeechRecognition | null {
  const speechWindow = window as SpeechWindow;
  const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
  if (!Recognition) return null;
  const recognition = new Recognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  return recognition;
}
