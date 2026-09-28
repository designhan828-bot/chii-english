import { useCallback, useEffect, useRef, useState } from 'react';
import { matchesSpeech, normalizeSpeech } from './speech-utils';

type SpeechResult = { correct: boolean; transcript: string; attemptId: string };
type RecognitionResult = { isFinal: boolean; [index: number]: { transcript: string } };
type RecognitionEvent = {
  resultIndex: number;
  results: { length: number; [index: number]: RecognitionResult };
};
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  abort: () => void;
};
type RecognitionConstructor = new () => Recognition;
type SpeechWindow = Window & {
  SpeechRecognition?: RecognitionConstructor;
  webkitSpeechRecognition?: RecognitionConstructor;
};
type RecognitionSession = {
  recognition: Recognition;
  timer: ReturnType<typeof setTimeout> | null;
  done: boolean;
};

function recognitionConstructor(): RecognitionConstructor | undefined {
  if (typeof window === 'undefined') return undefined;
  const browser = window as SpeechWindow;
  return browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
}

function detachRecognition(session: RecognitionSession) {
  session.done = true;
  if (session.timer !== null) clearTimeout(session.timer);
  session.recognition.onresult = null;
  session.recognition.onerror = null;
  session.recognition.onend = null;
  try { session.recognition.abort(); } catch { /* It may already have ended. */ }
}

function recognitionError(code: string): string {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return '麦克风或语音识别权限未开启，请在浏览器设置中允许后再试。这次不计入练习结果。';
    case 'audio-capture':
      return '没有找到可用的麦克风，请检查设备后再试。这次不计入练习结果。';
    case 'network':
      return '语音识别网络连接失败，请检查网络后再试。这次不计入练习结果。';
    case 'no-speech':
      return '刚才没有听清，靠近麦克风再试一次吧。这次不计入练习结果。';
    case 'language-not-supported':
      return '当前浏览器暂不支持英语识别，可以先听发音并自己跟读。';
    case 'aborted':
      return '这次跟读已中断，请重新开始。这次不计入练习结果。';
    default:
      return '语音识别暂时不可用，请稍后再试。这次不计入练习结果。';
  }
}

/** Browser transcription checks the recognized word; it is not pronunciation scoring. */
export function useSpeech() {
  const supportedSpeech = typeof window !== 'undefined'
    && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  const supportedRecognition = Boolean(recognitionConstructor());
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const mounted = useRef(true);
  const operation = useRef(0);
  const activeRecognition = useRef<RecognitionSession | null>(null);
  const activeUtterance = useRef<SpeechSynthesisUtterance | null>(null);

  const cancelActive = useCallback((updateState = true) => {
    // Invalidate callbacks before abort/cancel, which can synchronously emit events.
    operation.current += 1;
    const session = activeRecognition.current;
    activeRecognition.current = null;
    if (session) detachRecognition(session);
    const utterance = activeUtterance.current;
    activeUtterance.current = null;
    if (utterance) {
      utterance.onstart = null;
      utterance.onend = null;
      utterance.onerror = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (updateState && mounted.current) {
      setSpeaking(false);
      setListening(false);
    }
  }, []);

  const stop = useCallback(() => cancelActive(), [cancelActive]);
  const clearError = useCallback(() => setError(null), []);

  const speak = useCallback((text: string, rate = 1, onEnd?: () => void) => {
    cancelActive();
    setError(null);
    setTranscript(null);
    if (!supportedSpeech) {
      setError('当前浏览器不支持自动发音，可以换用支持语音播放的浏览器。');
      return;
    }
    if (!text.trim()) return;
    const token = operation.current;
    const synthesis = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synthesis.getVoices();
    const voice = voices.find((item) => /^en[-_]GB$/i.test(item.lang))
      ?? voices.find((item) => /^en[-_]US$/i.test(item.lang))
      ?? voices.find((item) => /^en(?:[-_]|$)/i.test(item.lang));
    utterance.lang = voice?.lang ?? 'en-GB';
    if (voice) utterance.voice = voice;
    utterance.rate = Number.isFinite(rate) ? Math.min(1.2, Math.max(0.5, rate)) : 1;
    activeUtterance.current = utterance;
    const current = () => mounted.current && token === operation.current
      && activeUtterance.current === utterance;
    utterance.onstart = () => { if (current()) setSpeaking(true); };
    utterance.onend = () => {
      if (!current()) return;
      activeUtterance.current = null;
      setSpeaking(false);
      onEnd?.();
    };
    utterance.onerror = () => {
      if (!current()) return;
      activeUtterance.current = null;
      setSpeaking(false);
      setError('发音播放失败，请再点一次小喇叭。');
    };
    try {
      setSpeaking(true);
      synthesis.speak(utterance);
    } catch {
      if (!current()) return;
      activeUtterance.current = null;
      setSpeaking(false);
      setError('发音播放失败，请再点一次小喇叭。');
    }
  }, [cancelActive, supportedSpeech]);

  const listen = useCallback((target: string, onResult: (result: SpeechResult) => void) => {
    cancelActive();
    setError(null);
    setTranscript(null);
    const Constructor = recognitionConstructor();
    if (!Constructor) {
      setError('当前浏览器暂不支持跟读识别，可以先听发音并自己跟读。');
      return;
    }
    if (!target.trim()) {
      setError('没有可练习的单词，请返回后重新选择。');
      return;
    }
    const token = operation.current;
    let recognition: Recognition;
    try { recognition = new Constructor(); } catch {
      setError('语音识别暂时无法启动，请稍后再试。这次不计入练习结果。');
      return;
    }
    const session: RecognitionSession = { recognition, timer: null, done: false };
    activeRecognition.current = session;
    const attemptId = globalThis.crypto?.randomUUID?.()
      ?? `speech-${Date.now()}-${token}-${Math.random().toString(36).slice(2, 9)}`;
    const current = () => mounted.current && token === operation.current
      && activeRecognition.current === session && !session.done;
    const finish = (message: string | null) => {
      if (!current()) return false;
      activeRecognition.current = null;
      detachRecognition(session);
      setListening(false);
      setError(message);
      return true;
    };
    recognition.lang = 'en-GB';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      if (!current()) return;
      const finalParts: string[] = [];
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const value = result?.[0]?.transcript?.trim();
        if (result?.isFinal && value) finalParts.push(value);
      }
      const spoken = finalParts.join(' ').trim();
      if (!spoken) return;
      if (!normalizeSpeech(spoken)) {
        finish(recognitionError('no-speech'));
        return;
      }
      if (!finish(null)) return;
      setTranscript(spoken);
      onResult({ correct: matchesSpeech(target, spoken), transcript: spoken, attemptId });
    };
    recognition.onerror = (event) => { finish(recognitionError(event.error)); };
    recognition.onend = () => { finish(recognitionError('no-speech')); };
    session.timer = setTimeout(() => {
      finish('这次跟读已超时（15 秒），请点麦克风再试一次。这次不计入练习结果。');
    }, 15_000);
    try {
      setListening(true);
      recognition.start();
    } catch (cause) {
      const denied = cause instanceof DOMException && cause.name === 'NotAllowedError';
      finish(recognitionError(denied ? 'not-allowed' : 'unavailable'));
    }
  }, [cancelActive]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      cancelActive(false);
    };
  }, [cancelActive]);

  return {
    supportedSpeech, supportedRecognition, speaking, listening, error, transcript,
    speak, listen, stop, clearError,
  };
}
