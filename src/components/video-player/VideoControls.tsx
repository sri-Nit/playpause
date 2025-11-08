import React from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, ChevronsLeft, ChevronsRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomSlider } from '@/components/CustomSlider';
import SettingsMenu from './SettingsMenu'; // Import the new SettingsMenu component

interface VideoControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackSpeed: number;
  isFullScreen: boolean;
  showMutedIndicator: boolean;
  videoEnded: boolean;
  isBuffering: boolean;
  togglePlayPause: () => void;
  handleProgressChange: (value: number[]) => void;
  setVolume: (newVolume: number) => void;
  toggleMute: () => void;
  setPlaybackSpeed: (speed: number) => void;
  seek: (seconds: number) => void;
  replay: () => void;
  handleFullScreenToggle: () => void;
  currentQuality: string;
  handleQualityChange: (quality: string) => void;
  settingsView: 'main' | 'speed' | 'quality';
  setSettingsView: (view: 'main' | 'speed' | 'quality') => void;
  showControls: boolean;
}

const VideoControls: React.FC<VideoControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  playbackSpeed,
  isFullScreen,
  showMutedIndicator,
  videoEnded,
  isBuffering,
  togglePlayPause,
  handleProgressChange,
  setVolume,
  toggleMute,
  setPlaybackSpeed,
  seek,
  replay,
  handleFullScreenToggle,
  currentQuality,
  handleQualityChange,
  settingsView,
  setSettingsView,
  showControls,
}) => {
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <>
      {/* Play/Pause Overlay (only visible when paused, not ended, and controls are shown) */}
      {(!isPlaying && showControls && !videoEnded && !isBuffering) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity duration-300 z-30">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 w-20 h-20" onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}>
            <Play className="h-12 w-12" />
            <span className="sr-only">Play</span>
          </Button>
        </div>
      )}

      {/* Replay Overlay (only visible when video has ended) */}
      {videoEnded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 transition-opacity duration-300 z-30">
          <Button variant="ghost" className="text-white hover:bg-white/20 w-32 h-32 rounded-full flex flex-col items-center justify-center" onClick={(e) => { e.stopPropagation(); replay(); }}>
            <RotateCcw className="h-20 w-20 mb-2" />
            <span className="text-lg font-semibold">Replay</span>
            <span className="sr-only">Replay Video</span>
          </Button>
        </div>
      )}

      {/* Custom Controls Overlay */}
      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 transition-opacity duration-300 ${
          showControls || !isPlaying || videoEnded ? 'opacity-100' : 'opacity-0'
        } z-50`}
        onClick={(e) => e.stopPropagation()} // prevent clicks on control bar from bubbling to player
      >
        {/* Progress Bar */}
        <div onClick={(e) => e.stopPropagation()}> {/* Stop propagation for progress slider */}
          <CustomSlider
            value={[currentTime]}
            max={duration}
            step={0.1}
            onValueChange={handleProgressChange}
            className="w-full mb-2 cursor-pointer"
            aria-label="Video progress"
          />
        </div>

        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); seek(-5); }} className="text-white hover:bg-white/20">
              <ChevronsLeft className="h-5 w-5" />
              <span className="sr-only">Rewind 5 seconds</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); togglePlayPause(); }} className="text-white hover:bg-white/20">
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              <span className="sr-only">{isPlaying ? 'Pause' : 'Play'}</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); seek(5); }} className="text-white hover:bg-white/20">
              <ChevronsRight className="h-5 w-5" />
              <span className="sr-only">Fast forward 5 seconds</span>
            </Button>
            
            {/* Volume control with always-visible slider */}
            <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}> {/* Stop propagation for volume slider */}
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); toggleMute(); }} className="text-white hover:bg-white/20">
                {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                <span className="sr-only">{isMuted ? 'Unmute' : 'Mute'}</span>
              </Button>
              <CustomSlider
                value={[isMuted ? 0 : volume * 100]}
                max={100}
                step={1}
                onValueChange={(value) => setVolume(value[0] / 100)}
                className="w-24 cursor-pointer"
                aria-label="Volume control"
              />
            </div>

            <div className="text-sm font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {showMutedIndicator && isPlaying && !videoEnded && (
              <div className="flex items-center text-xs text-white bg-gray-700 px-2 py-1 rounded-md">
                <VolumeX className="h-3 w-3 mr-1" /> Muted
              </div>
            )}
            <div onClick={(e) => e.stopPropagation()}>
              <SettingsMenu
                playbackSpeed={playbackSpeed}
                setPlaybackSpeed={setPlaybackSpeed}
                currentQuality={currentQuality}
                handleQualityChange={handleQualityChange}
                settingsView={settingsView}
                setSettingsView={setSettingsView}
              />
            </div>
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleFullScreenToggle(); }} className="text-white hover:bg-white/20">
              {isFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
              <span className="sr-only">{isFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default VideoControls;