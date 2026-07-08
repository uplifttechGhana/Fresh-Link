import { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { resolveMediaUrl } from '../../lib/hooks/useStorage';

const BAR_COUNT = 32;

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Deterministic pseudo-waveform from the audio URL (WhatsApp-style static bars). */
function buildWaveform(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return Array.from({ length: BAR_COUNT }, (_, i) => {
    hash = (hash * 1664525 + 1013904223 + i) >>> 0;
    return 0.2 + (hash % 80) / 100;
  });
}

function VoiceWaveform({
  bars,
  progress,
  isMe,
}: {
  bars: number[];
  progress: number;
  isMe: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-[2px] h-8 flex-1 min-w-[100px] max-w-[148px]">
      {bars.map((height, i) => {
        const threshold = ((i + 1) / bars.length) * 100;
        const played = progress >= threshold;
        return (
          <span
            key={i}
            className={`w-[2.5px] rounded-full transition-colors duration-150 ${
              played
                ? isMe
                  ? 'bg-white'
                  : 'bg-green'
                : isMe
                  ? 'bg-white/35'
                  : 'bg-gray-300'
            }`}
            style={{ height: `${Math.round(height * 20)}px` }}
          />
        );
      })}
    </div>
  );
}

export function VoiceMessage({
  audioUrl,
  duration,
  isMe,
}: {
  audioUrl: string;
  duration?: number | null;
  isMe: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState(0);
  const [error, setError] = useState(false);
  const bars = useMemo(() => buildWaveform(audioUrl), [audioUrl]);

  useEffect(() => {
    setPlaying(false);
    setProgress(0);
    setCurrent(0);
    setError(false);

    const src = resolveMediaUrl(audioUrl);
    const audio = new Audio(src);
    audioRef.current = audio;

    const onTime = () => {
      setCurrent(Math.floor(audio.currentTime));
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
    };
    const onEnded = () => {
      setPlaying(false);
      setProgress(0);
      setCurrent(0);
    };
    const onError = () => setError(true);

    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audioRef.current = null;
    };
  }, [audioUrl]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio || error) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    try {
      await audio.play();
      setPlaying(true);
      setError(false);
    } catch {
      setPlaying(false);
      setError(true);
    }
  };

  const shownDuration = duration ?? current;

  return (
    <button
      type="button"
      onClick={toggle}
      className={`flex items-center justify-center gap-2 w-full min-w-[200px] h-9 ${isMe ? 'text-white' : 'text-ink'}`}
    >
      <span
        className={`w-8 h-8 rounded-full inline-flex items-center justify-center flex-shrink-0 ${
          isMe ? 'bg-white/20' : 'bg-green-50 text-green'
        }`}
      >
        {playing ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
      </span>
      <VoiceWaveform bars={bars} progress={progress} isMe={isMe} />
      <span
        className={`text-[11px] font-medium tabular-nums flex-shrink-0 self-center ${
          isMe ? 'text-green-100' : 'text-muted'
        }`}
      >
        {error ? '!' : formatDuration(playing ? current : shownDuration)}
      </span>
    </button>
  );
}
