import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useVideoPlayer } from '@/hooks/useVideoPlayer'; // Import the custom hook
import VideoControls from './video-player/VideoControls'; // Import the new VideoControls component

interface CustomVideoPlayerProps {
  videoUrl: string;
  title: string;
  thumbnailUrl: string;
  onProgressThresholdMet: (videoId: string) => void;
  videoId: string;
}

const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({
  videoUrl,
  title,
  thumbnailUrl,
  onProgressThresholdMet,
  videoId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentQuality, setCurrentQuality] = useState('Auto'); // State for quality
  const [settingsView, setSettingsView] = useState<'main' | 'speed' | 'quality'>('main'); // New state for nested settings

  const {
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
  } = useVideoPlayer({ videoUrl, videoId, onProgressThresholdMet });

  const showMutedIndicator = isMuted && isPlaying && !videoEnded;

  const handleFullScreenToggle = useCallback(() => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
      } else {
        document.exitFullscreen();
      }
    }
  }, []);

  const handleFullScreenChange = useCallback(() => {
    setIsFullScreen(!!document.fullscreenElement);
  }, []);

  const hideControls = useCallback(() => {
    if (videoRef.current && isPlaying && !videoEnded) {
      setShowControls(false);
    }
  }, [isPlaying, videoEnded, videoRef]);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(hideControls, 3000);
  }, [hideControls]);

  const handleDoubleClick = useCallback(() => {
    handleFullScreenToggle();
  }, [handleFullScreenToggle]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!videoRef.current) return;

    switch (event.key) {
      case ' ': // Spacebar
      case 'k': // K key
        event.preventDefault(); // Prevent scrolling
        togglePlayPause();
        break;
      case 'm': // M key
      case 'M':
        toggleMute();
        break;
      case 'f': // F key
      case 'F':
        handleFullScreenToggle();
        break;
      case 'ArrowLeft': // Left arrow key
        seek(-5);
        showControlsTemporarily();
        break;
      case 'j': // J key
        seek(-10);
        showControlsTemporarily();
        break;
      case 'ArrowRight': // Right arrow key
        seek(5);
        showControlsTemporarily();
        break;
      case 'l': // L key
        seek(10);
        showControlsTemporarily();
        break;
    }
  }, [togglePlayPause, toggleMute, handleFullScreenToggle, seek, showControlsTemporarily, videoRef]);

  // Add and remove fullscreen event listener
  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, [handleFullScreenChange]);

  // Add and remove keyboard event listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      container.tabIndex = 0; // Make the container focusable
      return () => {
        container.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [handleKeyDown]);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full group bg-black rounded-md overflow-hidden focus:outline-none"
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => {
        if (isPlaying && !videoEnded) {
          controlsTimeoutRef.current = setTimeout(hideControls, 3000);
        }
      }}
    >
      <AspectRatio ratio={16 / 9}>
        <video
          ref={videoRef}
          src={videoUrl}
          title={title}
          className="w-full h-full object-cover"
          poster={thumbnailUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleVideoEnded}
          onDoubleClick={handleDoubleClick}
          onWaiting={handleWaiting}
          onPlaying={handlePlaying}
          autoPlay
          muted
          playsInline
          onClick={togglePlayPause} {/* Moved onClick here */}
        >
          Your browser does not support the video tag.
        </video>
      </AspectRatio>

      {/* Loading Spinner Overlay */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity duration-300 z-40">
          <Loader2 className="h-12 w-12 animate-spin text-white" />
          <span className="sr-only">Loading video...</span>
        </div>
      )}

      <VideoControls
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        playbackSpeed={playbackSpeed}
        isFullScreen={isFullScreen}
        showMutedIndicator={showMutedIndicator}
        videoEnded={videoEnded}
        isBuffering={isBuffering}
        togglePlayPause={togglePlayPause}
        handleProgressChange={handleProgressChange}
        setVolume={setVolume}
        toggleMute={toggleMute}
        setPlaybackSpeed={setPlaybackSpeed}
        seek={seek}
        replay={replay}
        handleFullScreenToggle={handleFullScreenToggle}
        currentQuality={currentQuality}
        handleQualityChange={setCurrentQuality} // Update currentQuality state
        settingsView={settingsView}
        setSettingsView={setSettingsView}
        showControls={showControls}
      />
    </div>
  );
};

export default CustomVideoPlayer;