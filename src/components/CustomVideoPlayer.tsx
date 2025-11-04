import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, Play, Pause, Volume2, VolumeX, Maximize, Minimize, ChevronLeft, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Slider } from '@/components/ui/slider';

interface CustomVideoPlayerProps {
  videoUrl: string;
  title: string;
  thumbnailUrl: string;
  onProgressThresholdMet: (videoId: string) => void;
  videoId: string;
}

const playbackSpeeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
const qualityOptions = ['Auto', '1080p', '720p', '480p']; // Placeholder for quality options

const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({
  videoUrl,
  title,
  thumbnailUrl,
  onProgressThresholdMet,
  videoId,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(0.5); // Default volume
  const [isMuted, setIsMuted] = useState(true); // Start muted for autoplay
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [hasMetThreshold, setHasMetThreshold] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [currentQuality, setCurrentQuality] = useState('Auto'); // State for quality
  const [settingsView, setSettingsView] = useState<'main' | 'speed' | 'quality'>('main'); // New state for nested settings
  const [videoEnded, setVideoEnded] = useState(false);

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(error => console.warn("Play prevented:", error));
      }
      setIsPlaying(!isPlaying);
      setVideoEnded(false); // If playing, it's not ended
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      videoRef.current.volume = volume; // Set initial volume
      videoRef.current.muted = isMuted; // Apply initial mute state
    }
  };

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

  const handleProgressChange = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0] / 100;
    setVolume(newVolume);
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
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
      if (!isMuted && volume === 0) { // If unmuting from 0 volume, set to a default
        setVolume(0.5);
        videoRef.current.volume = 0.5;
      }
    }
  };

  const handleSpeedChange = (speed: string) => {
    const newSpeed = parseFloat(speed);
    setPlaybackSpeed(newSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = newSpeed;
    }
  };

  const handleQualityChange = (quality: string) => {
    setCurrentQuality(quality);
    // NOTE: Implementing actual video quality switching requires multiple video sources
    // (e.g., different video_url for each resolution) and a more complex video player
    // implementation (e.g., using HLS/DASH). For now, this is a UI-only change.
    console.log(`Changing quality to: ${quality}`);
    // If you had multiple URLs, you would update videoRef.current.src here
  };

  const handleFullScreenToggle = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
      } else {
        document.exitFullscreen();
      }
    }
  };

  const handleFullScreenChange = () => {
    setIsFullScreen(!!document.fullscreenElement);
  };

  const hideControls = () => {
    if (videoRef.current && isPlaying && !videoEnded) { // Only hide if playing and not ended
      setShowControls(false);
    }
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(hideControls, 3000);
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    setVideoEnded(true);
    setShowControls(true); // Show controls when video ends
  };

  const handleReplay = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(error => console.warn("Replay prevented:", error));
      setVideoEnded(false);
      setIsPlaying(true);
      setShowControls(false); // Hide controls after replay starts
    }
  };

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!videoRef.current) return;

    switch (event.key) {
      case ' ': // Spacebar
        event.preventDefault(); // Prevent scrolling
        handlePlayPause();
        break;
      case 'm': // M key
      case 'M':
        handleMuteToggle();
        break;
      case 'f': // F key
      case 'F':
        handleFullScreenToggle();
        break;
      // Add more shortcuts as needed (e.g., arrow keys for seeking)
    }
  }, [handlePlayPause, handleMuteToggle, handleFullScreenToggle]);

  const handleDoubleClick = () => {
    handleFullScreenToggle();
  };

  useEffect(() => {
    setHasMetThreshold(false);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.playbackRate = playbackSpeed;
      videoRef.current.volume = volume;
      videoRef.current.muted = isMuted; // Ensure muted state is applied on load
      videoRef.current.play().catch(error => {
        console.warn("Autoplay prevented:", error);
      });
      setIsPlaying(true); // Assume playing if autoplay is attempted
      setVideoEnded(false); // Reset video ended state on new video load
    }
  }, [videoId, videoUrl]);

  // Effect to update playback speed when the prop changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Add and remove fullscreen event listener
  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
    };
  }, []);

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
        if (isPlaying && !videoEnded) { // Only hide if playing and not ended
          controlsTimeoutRef.current = setTimeout(hideControls, 3000);
        }
      }}
      onClick={handlePlayPause} // Toggle play/pause on video click
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
          onPlay={() => setIsPlaying(true)}
          onPause={() => setShowControls(true)} // Show controls when paused
          onEnded={handleVideoEnded}
          onDoubleClick={handleDoubleClick}
          autoPlay
          muted // Start muted to increase autoplay success rate
          playsInline
        >
          Your browser does not support the video tag.
        </video>
      </AspectRatio>

      {/* Play/Pause Overlay (only visible when paused, not ended, and controls are shown) */}
      {(!isPlaying && showControls && !videoEnded) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity duration-300">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 w-20 h-20" onClick={handlePlayPause}>
            <Play className="h-12 w-12" />
            <span className="sr-only">Play</span>
          </Button>
        </div>
      )}

      {/* Replay Overlay (only visible when video has ended) */}
      {videoEnded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 transition-opacity duration-300">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 w-20 h-20" onClick={handleReplay}>
            <RotateCcw className="h-12 w-12" />
            <span className="sr-only">Replay</span>
          </Button>
        </div>
      )}

      {/* Custom Controls Overlay */}
      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 transition-opacity duration-300 ${
          showControls || !isPlaying || videoEnded ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress Bar */}
        <Slider
          value={[currentTime]}
          max={duration}
          step={0.1}
          onValueChange={handleProgressChange}
          className="w-full mb-2 cursor-pointer"
          thumbClassName="w-4 h-4 bg-primary rounded-full border-2 border-white"
          trackClassName="bg-gray-600 h-1 rounded-full"
          rangeClassName="bg-primary h-1 rounded-full"
          aria-label="Video progress"
        />

        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" onClick={handlePlayPause} className="text-white hover:bg-white/20">
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              <span className="sr-only">{isPlaying ? 'Pause' : 'Play'}</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleMuteToggle} className="text-white hover:bg-white/20">
              {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              <span className="sr-only">{isMuted ? 'Unmute' : 'Mute'}</span>
            </Button>
            <Slider
              value={[isMuted ? 0 : volume * 100]}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              className="w-24 cursor-pointer"
              thumbClassName="w-3 h-3 bg-primary rounded-full border-2 border-white"
              trackClassName="bg-gray-600 h-1 rounded-full"
              rangeClassName="bg-primary h-1 rounded-full"
              aria-label="Volume control"
            />
            <div className="text-sm font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <DropdownMenu onOpenChange={(open) => {
              if (!open) {
                setSettingsView('main'); // Reset to main view when dropdown closes
              }
            }}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Video Settings</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                {settingsView === 'main' && (
                  <>
                    <DropdownMenuLabel>Video Settings</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setSettingsView('speed'); }} className="flex justify-between items-center">
                      <span>Playback Speed</span>
                      <span className="text-muted-foreground">{playbackSpeed === 1.0 ? 'Normal' : `${playbackSpeed}x`}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setSettingsView('quality'); }} className="flex justify-between items-center">
                      <span>Quality</span>
                      <span className="text-muted-foreground">{currentQuality}</span>
                    </DropdownMenuItem>
                  </>
                )}

                {settingsView === 'speed' && (
                  <>
                    <DropdownMenuLabel className="flex items-center">
                      <Button variant="ghost" size="icon" className="h-6 w-6 mr-2" onClick={() => setSettingsView('main')}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      Playback Speed
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={playbackSpeed.toString()} onValueChange={handleSpeedChange}>
                      {playbackSpeeds.map((speed) => (
                        <DropdownMenuRadioItem key={speed} value={speed.toString()}>
                          {speed === 1.0 ? 'Normal' : `${speed}x`}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </>
                )}

                {settingsView === 'quality' && (
                  <>
                    <DropdownMenuLabel className="flex items-center">
                      <Button variant="ghost" size="icon" className="h-6 w-6 mr-2" onClick={() => setSettingsView('main')}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      Quality
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={currentQuality} onValueChange={handleQualityChange}>
                      {qualityOptions.map((quality) => (
                        <DropdownMenuRadioItem key={quality} value={quality}>
                          {quality}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                    <p className="text-xs text-muted-foreground p-2">
                      Note: Actual quality switching requires multiple video sources.
                    </p>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" onClick={handleFullScreenToggle} className="text-white hover:bg-white/20">
              {isFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
              <span className="sr-only">{isFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomVideoPlayer;