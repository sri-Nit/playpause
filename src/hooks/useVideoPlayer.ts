import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Video } from '@/lib/video-store'; // Assuming Video type is available

interface UseVideoPlayerProps {
  videoUrl: string;
  videoId: string;
  onProgressThresholdMet: (videoId: string) => void;
}

export const useVideoPlayer = ({ videoUrl, videoId, onProgressThresholdMet }: UseVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState<number>(0.5); // Internal state for volume
  const [isMuted, setIsMuted] = useState(true); // Start muted for autoplay
  const [playbackSpeed, setPlaybackSpeedState] = useState<number>(1.0);
  const [isBuffering, setIsBuffering] = useState(true);
  const [videoEnded, setVideoEnded] = useState(false);
  const [hasMetThreshold, setHasMetThreshold] = useState(false);

  const togglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(error => console.warn("Play prevented:", error));
      }
      setIsPlaying(!isPlaying);
      setVideoEnded(false);
    }
  }, [isPlaying]);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
      setIsBuffering(false);
    }
  }, [volume, isMuted]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (!hasMetThreshold) {
        const percentageWatched = (videoRef.current.currentTime / videoRef.current.duration) * 100;
        if (percentageWatched >= 50) {
          setHasMetThreshold(true);
          onProgressThresholdMet(videoId);
        }
      }
    }
  }, [hasMetThreshold, onProgressThresholdMet, videoId]);

  const handleProgressChange = useCallback((value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      if (newVolume > 0 && isMuted) {
        setIsMuted(false);
        videoRef.current.muted = false;
      } else if (newVolume === 0 && !isMuted) {
        setIsMuted(true);
        videoRef.current.muted = true;
      }
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
      if (!isMuted && volume === 0) {
        setVolume(0.5); // Unmuting from 0 volume, set to a default
      }
    }
  }, [isMuted, volume, setVolume]);

  const setPlaybackSpeed = useCallback((speed: number) => {
    setPlaybackSpeedState(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  }, []);

  const seek = useCallback((seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.duration, videoRef.current.currentTime + seconds));
    }
  }, []);

  const replay = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(error => console.warn("Replay prevented:", error));
      setVideoEnded(false);
      setIsPlaying(true);
    }
  }, []);

  const handleVideoEnded = useCallback(() => {
    setIsPlaying(false);
    setVideoEnded(true);
  }, []);

  const handleWaiting = useCallback(() => setIsBuffering(true), []);
  const handlePlaying = useCallback(() => setIsBuffering(false), []);
  const handlePlay = useCallback(() => { setIsPlaying(true); setIsBuffering(false); }, []);
  const handlePause = useCallback(() => setIsPlaying(false), []);

  // Effect to load video and reset states when videoId or videoUrl changes
  useEffect(() => {
    setHasMetThreshold(false);
    setIsBuffering(true);
    setVideoEnded(false);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.playbackRate = playbackSpeed;
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted;
      videoRef.current.play().catch(error => {
        console.warn("Autoplay prevented:", error);
      });
      setIsPlaying(true);
    }
  }, [videoId, videoUrl, playbackSpeed, volume, isMuted]);

  return {
    videoRef,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackSpeed,
    isBuffering,
    videoEnded,
    togglePlayPause,
    handleLoadedMetadata,
    handleTimeUpdate,
    handleProgressChange,
    setVolume,
    toggleMute,
    setPlaybackSpeed,
    seek,
    replay,
    handleVideoEnded,
    handleWaiting,
    handlePlaying,
    handlePlay,
    handlePause,
  };
};