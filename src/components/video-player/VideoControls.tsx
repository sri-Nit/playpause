import React from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CustomSlider } from '@/components/CustomSlider';
import SettingsMenu from './SettingsMenu';

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

/**
 * Updated VideoControls:
 * - Single gradient progress line (removed duplicate "two lines" look)
 * - Accessible invisible slider overlay for scrubbing (keeps keyboard + screen-reader support)
 * - Restyled rewind/forward buttons to be round, prominent, and consistent
 * - Improved volume rocker visuals (rounded pill track, cleaner spacing)
 *
 * Drop this file in place of your existing VideoControls.tsx
 */
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

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Play overlay */}
      {(!isPlaying && showControls && !videoEnded && !isBuffering) && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity duration-300 z-30"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 w-20 h-20 rounded-full backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              togglePlayPause();
            }}
          >
            <Play className="h-12 w-12" />
            <span className="sr-only">Play</span>
          </Button>
        </div>
      )}

      {/* Replay overlay */}
      {videoEnded && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/70 transition-opacity duration-300 z-40"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            className="text-white hover:bg-white/20 w-32 h-32 rounded-full flex flex-col items-center justify-center backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              replay();
            }}
          >
            <RotateCcw className="h-20 w-20 mb-2" />
            <span className="text-lg font-semibold">Replay</span>
            <span className="sr-only">Replay Video</span>
          </Button>
        </div>
      )}

      {/* Controls bar */}
      <div
        className={`absolute inset-x-0 bottom-0 p-4 transition-opacity duration-300 ${
          showControls || !isPlaying || videoEnded ? 'opacity-100' : 'opacity-0'
        } z-50`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Single gradient progress bar with invisible accessible slider on top */}
        <div
          className="relative w-full mb-3 h-4 select-none"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Visible gradient track */}
          <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-150"
              style={{
                width: `${progressPct}%`,
                background:
                  'linear-gradient(90deg, #7c3aed 0%, #ec4899 50%, #f59e0b 100%)',
              }}
            />
          </div>

          {/* Visible scrub handle mark for visual cue (not functional by itself) */}
          <div
            className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-lg"
            style={{ right: `${100 - progressPct}%`, marginRight: '-8px' }}
            aria-hidden
          />

          {/* Invisible (but keyboard+pointer accessible) slider overlay */}
          <div className="absolute inset-0">
            <CustomSlider
              value={[currentTime]}
              max={duration}
              step={0.1}
              onValueChange={handleProgressChange}
              className="w-full h-full opacity-0" // visually hidden but still interactive
              aria-label="Video progress"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
            {/* Rewind button - bigger, rounded, with subtle bg */}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); seek(-5); }}
              className="text-white bg-white/2 hover:bg-white/6 w-10 h-10 rounded-full flex items-center justify-center transition"
            >
              <ChevronsLeft className="h-5 w-5" />
              <span className="sr-only">Rewind 5 seconds</span>
            </Button>

            {/* Play/Pause - more prominent circular control */}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
              className="text-white hover:bg-white/10 w-10 h-10 rounded-full flex items-center justify-center"
              aria-pressed={isPlaying}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              <span className="sr-only">{isPlaying ? 'Pause' : 'Play'}</span>
            </Button>

            {/* Fast-forward button - symmetric to rewind */}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); seek(5); }}
              className="text-white bg-white/2 hover:bg-white/6 w-10 h-10 rounded-full flex items-center justify-center transition"
            >
              <ChevronsRight className="h-5 w-5" />
              <span className="sr-only">Fast forward 5 seconds</span>
            </Button>

            {/* Volume rocker */}
            <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                className="text-white hover:bg-white/6 w-9 h-9 rounded-full flex items-center justify-center"
                aria-pressed={isMuted}
              >
                {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                <span className="sr-only">{isMuted ? 'Unmute' : 'Mute'}</span>
              </Button>

              {/* Styled pill surrounding the slider for better UX */}
              <div className="w-28 bg-white/3 rounded-full px-2 py-1 flex items-center">
                <div className="flex-1">
                  <CustomSlider
                    value={[isMuted ? 0 : volume * 100]}
                    max={100}
                    step={1}
                    onValueChange={(value) => setVolume(value[0] / 100)}
                    className="w-full h-5" // depends on your CustomSlider implementation; adjust if needed
                    aria-label="Volume control"
                  />
                </div>
              </div>
            </div>

            <div className="text-sm font-mono ml-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {showMutedIndicator && isPlaying && !videoEnded && (
              <div className="flex items-center text-xs text-white bg-gray-700/70 px-2 py-1 rounded-md">
                <VolumeX className="h-3 w-3 mr-1" /> Muted
              </div>
            )}

            {/* SettingsMenu is in-place so it will remain visible in fullscreen */}
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

            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); handleFullScreenToggle(); }}
              className="text-white hover:bg-white/10 w-9 h-9 rounded-full"
            >
              {isFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
              <span className="sr-only">{isFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}</span>
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        /* small helper styles to ensure consistent look for the custom parts */
        .bg-white\\/2 { background-color: rgba(255,255,255,0.02); }
        .bg-white\\/3 { background-color: rgba(255,255,255,0.03); }
        .bg-white\\/6 { background-color: rgba(255,255,255,0.06); }
      `}</style>
    </>
  );
};

export default VideoControls;