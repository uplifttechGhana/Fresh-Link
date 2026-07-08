import { useCallback, useEffect, useRef, useState } from 'react';

export interface VoiceRecording {
  blob: Blob;
  duration: number;
  mimeType: string;
}

function pickMimeType() {
  if (typeof MediaRecorder === 'undefined') return '';
  if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return 'audio/webm;codecs=opus';
  if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm';
  if (MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4';
  return '';
}

export function useVoiceRecorder() {
  const [sessionActive, setSessionActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const durationRef = useRef(0);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const stopTimer = useCallback(() => {
    clearInterval(timerRef.current);
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(() => {
      durationRef.current += 1;
      setDuration(durationRef.current);
    }, 1000);
  }, [stopTimer]);

  const reset = useCallback(() => {
    stopTimer();
    durationRef.current = 0;
    setDuration(0);
    setSessionActive(false);
    setIsPaused(false);
    chunksRef.current = [];
    mediaRecorderRef.current = null;
    cleanupStream();
  }, [cleanupStream, stopTimer]);

  const start = useCallback(async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Microphone not supported on this device');
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.start(200);
      mediaRecorderRef.current = recorder;
      durationRef.current = 0;
      setDuration(0);
      setSessionActive(true);
      setIsPaused(false);
      startTimer();
      return true;
    } catch {
      setError('Microphone permission denied');
      cleanupStream();
      return false;
    }
  }, [cleanupStream, startTimer]);

  const pause = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== 'recording') return false;
    recorder.pause();
    stopTimer();
    setIsPaused(true);
    return true;
  }, [stopTimer]);

  const resume = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== 'paused') return false;
    recorder.resume();
    setIsPaused(false);
    startTimer();
    return true;
  }, [startTimer]);

  const stop = useCallback(async (): Promise<VoiceRecording | null> => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      reset();
      return null;
    }

    return new Promise((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const result =
          blob.size > 0 && durationRef.current > 0
            ? {
                blob,
                duration: durationRef.current,
                mimeType: recorder.mimeType || 'audio/webm',
              }
            : null;
        reset();
        resolve(result);
      };
      recorder.stop();
    });
  }, [reset]);

  const cancel = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = null;
      recorder.stop();
    }
    reset();
  }, [reset]);

  useEffect(() => () => {
    stopTimer();
    cleanupStream();
  }, [cleanupStream, stopTimer]);

  return {
    sessionActive,
    isPaused,
    duration,
    error,
    start,
    pause,
    resume,
    stop,
    cancel,
  };
}
