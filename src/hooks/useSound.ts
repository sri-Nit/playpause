import { useCallback, useEffect, useRef } from 'react';

type UseSoundOptions = {
  volume?: number;
  loop?: boolean;
};

export const useSound = (src: string, options?: UseSoundOptions) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { volume = 1, loop = false } = options || {};

  useEffect(() => {
    if (typeof Audio !== 'undefined') {
      audioRef.current = new Audio(src);
      audioRef.current.volume = volume;
      audioRef.current.loop = loop;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [src, volume, loop]);

  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0; // Reset to start for immediate playback
      audioRef.current.play().catch(error => {
        console.warn(`Failed to play sound from ${src}:`, error);
        // This often happens if the user hasn't interacted with the document yet (autoplay policy)
      });
    }
  }, [src]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  return { play, stop };
};