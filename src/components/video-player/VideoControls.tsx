import React, { useEffect, useRef, useState } from 'react';
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
 * Minimal change: white thin progress line (clean single line) + cute compact volume rocker.
 * - Keeps the same API as before.
 * - Uses CustomSlider with classNames "progress-slider" and "volume-slider".
 * - Auto-hide logic retained.
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

  // Auto-hide controls logic (2s)
  const [localVisible, setLocalVisible] = useState(true);
  const hideTimer = useRef<number | null>(null);

  const showAndReset = () => {
    setLocalVisible(true);
    if (hideTimer.current) {
      window.clearTimeout(hideTimer.current);
    }
    if (isPlaying && !videoEnded) {
      hideTimer.current = window.setTimeout(() => {
        setLocalVisible(false);
        hideTimer.current = null;
      }, 2000);
    }
  };

  useEffect(() => {
    if (!isPlaying || videoEnded) {
      if (hideTimer.current) {
        window.clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
      setLocalVisible(true);
      return;
    }
    showAndReset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, videoEnded]);

  useEffect(() => {
    const onActivity = () => showAndReset();
    window.addEventListener('mousemove', onActivity);
    window.addEventListener('touchstart', onActivity);
    window.addEventListener('keydown', onActivity);
    return () => {
      window.removeEventListener('mousemove', onActivity);
      window.removeEventListener('touchstart', onActivity);
      window.removeEventListener('keydown', onActivity);
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = showControls || localVisible || !isPlaying || videoEnded || isBuffering;

  return (
    <>
      {/* Play overlay */}
      {(!isPlaying && visible && !videoEnded && !isBuffering) && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity duration-300 z-30"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 w-20 h-20 rounded-full"
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
      {videoEnded && visible && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/70 transition-opacity duration-300 z-40"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            className="text-white hover:bg-white/20 w-32 h-32 rounded-full flex flex-col items-center justify-center"
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
          visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        } z-50`}
        onClick={(e) => {
          e.stopPropagation();
          showAndReset();
        }}
        onPointerEnter={() => {
          if (hideTimer.current) {
            window.clearTimeout(hideTimer.current);
            hideTimer.current = null;
          }
          setLocalVisible(true);
        }}
        onPointerLeave={() => {
          if (isPlaying && !videoEnded) showAndReset();
        }}
      >
        {/* White lined "normal" slider */}
        <div className="relative w-full mb-3" onClick={(e) => e.stopPropagation()}>
          <CustomSlider
            value={[currentTime]}
            max={duration}
            step={0.1}
            onValueChange={handleProgressChange}
            className="w-full progress-slider"
            aria-label="Video progress"
          />

          {/* subtle white progress fill behind track for extra clarity */}
          <div
            aria-hidden
            className="absolute left-0 top-1/2 transform -translate-y-1/2 h-[4px] rounded-full pointer-events-none"
            style={{
              width: `${progressPct}%`,
              background: 'rgba(255,255,255,0.95)',
              mixBlendMode: 'normal',
              opacity: 0.18,
            }}
          />
        </div>

        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); seek(-5); showAndReset(); }}
              className="text-white hover:bg-white/6 w-10 h-10 rounded-full flex items-center justify-center"
              title="Rewind 5s"
            >
              <ChevronsLeft className="h-5 w-5" />
              <span className="sr-only">Rewind 5 seconds</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); togglePlayPause(); showAndReset(); }}
              className="text-white hover:bg-white/6 w-11 h-11 rounded-full flex items-center justify-center"
              aria-pressed={isPlaying}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              <span className="sr-only">{isPlaying ? 'Pause' : 'Play'}</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); seek(5); showAndReset(); }}
              className="text-white hover:bg-white/6 w-10 h-10 rounded-full flex items-center justify-center"
              title="Forward 5s"
            >
              <ChevronsRight className="h-5 w-5" />
              <span className="sr-only">Fast forward 5 seconds</span>
            </Button>

            {/* Cute compact volume rocker */}
            <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); toggleMute(); showAndReset(); }}
                className="text-white w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/6"
                aria-pressed={isMuted}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                <span className="sr-only">{isMuted ? 'Unmute' : 'Mute'}</span>
              </Button>

              <div className="w-28 flex items-center">
                <CustomSlider
                  value={[isMuted ? 0 : volume * 100]}
                  max={100}
                  step={1}
                  onValueChange={(value) => { setVolume(value[0] / 100); showAndReset(); }}
                  className="w-full volume-slider"
                  aria-label="Volume control"
                />
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

            <div onClick={(e) => { e.stopPropagation(); showAndReset(); }}>
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
              onClick={(e) => { e.stopPropagation(); handleFullScreenToggle(); showAndReset(); }}
              className="text-white w-9 h-9 rounded-full hover:bg-white/6"
            >
              {isFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
              <span className="sr-only">{isFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}</span>
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        /* White lined progress slider (normal/thin) */
        .progress-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 18px;
          background: transparent;
          position: relative;
          z-index: 30;
        }
        .progress-slider::-webkit-slider-runnable-track {
          height: 4px;
          border-radius: 999px;
          background: rgba(255,255,255,0.12);
        }
        .progress-slider::-moz-range-track {
          height: 4px;
          border-radius: 999px;
          background: rgba(255,255,255,0.12);
        }
        .progress-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 999px;
          background: #fff;
          box-shadow: 0 6px 18px rgba(0,0,0,0.45);
          margin-top: -4px;
          border: 2px solid rgba(255,255,255,0.95);
        }
        .progress-slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 999px;
          background: #fff;
          box-shadow: 0 6px 18px rgba(0,0,0,0.45);
          border: none;
        }

        /* Cute compact volume slider */
        .volume-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 12px;
          background: transparent;
        }
        .volume-slider::-webkit-slider-runnable-track {
          height: 6px;
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(255,255,255,0.22), rgba(255,255,255,0.08));
        }
        .volume-slider::-moz-range-track {
          height: 6px;
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(255,255,255,0.22), rgba(255,255,255,0.08));
        }
        .volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #fff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.45);
          margin-top: -2px;
          border: 1px solid rgba(0,0,0,0.08);
        }
        .volume-slider::-moz-range-thumb {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #fff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.45);
          border: none;
        }

        /* helpers */
        .hover\\:bg-white\\/6:hover { background-color: rgba(255,255,255,0.06); }
      `}</style>
    </>
  );
};

export default VideoControls;