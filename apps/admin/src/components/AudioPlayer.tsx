'use client';

import { useRef, useState } from 'react';

export default function AudioPlayer({ url }: { url?: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  if (!url) return <p className="text-sm text-gray-400">No audio available</p>;

  const toggle = () => {
    if (!ref.current) return;
    if (playing) { ref.current.pause(); setPlaying(false); }
    else { ref.current.play(); setPlaying(true); }
  };

  return (
    <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
      <button
        onClick={toggle}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white hover:bg-primary-dark"
      >
        {playing ? '⏸' : '▶'}
      </button>
      <audio
        ref={ref}
        src={url}
        onEnded={() => setPlaying(false)}
        className="hidden"
      />
      <span className="text-sm text-gray-500">{playing ? 'Playing…' : 'Tap to play'}</span>
    </div>
  );
}
