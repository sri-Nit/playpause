import React, { useEffect, useRef, useState } from 'react';
import { Settings, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SettingsMenuProps {
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
  currentQuality: string;
  handleQualityChange: (quality: string) => void;
  settingsView: 'main' | 'speed' | 'quality';
  setSettingsView: (view: 'main' | 'speed' | 'quality') => void;
}

/**
 * In-place SettingsMenu (cute + compact).
 * - Renders as a child (no portal) so it stays inside fullscreen
 * - click outside, Escape to close
 * - small, rounded, glass/blur style to match the controls
 */
const playbackSpeeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
const qualityOptions = ['Auto', '1080p', '720p', '480p'];

const SettingsMenu: React.FC<SettingsMenuProps> = ({
  playbackSpeed,
  setPlaybackSpeed,
  currentQuality,
  handleQualityChange,
  settingsView,
  setSettingsView,
}) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSettingsView('main');
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        setSettingsView('main');
      }
    }
    if (open) {
      document.addEventListener('mousedown', onDoc);
      document.addEventListener('keydown', onKey);
    }
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, setSettingsView]);

  // If parent switches to a sub-view, ensure menu opens
  useEffect(() => {
    if (settingsView !== 'main') setOpen(true);
  }, [settingsView]);

  function toggleOpen(e?: React.MouseEvent) {
    e?.stopPropagation();
    setOpen((o) => {
      const next = !o;
      if (!next) setSettingsView('main');
      return next;
    });
  }

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onClick={(e) => e.stopPropagation()}
      aria-hidden={false}
    >
      <Button
        variant="ghost"
        size="icon"
        className="text-white hover:bg-white/10 focus-visible:ring-0 transition-transform active:scale-95"
        onClick={toggleOpen}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Settings className="h-5 w-5" />
        <span className="sr-only">Video Settings</span>
      </Button>

      {open && (
        <div
          role="menu"
          aria-label="Video settings"
          className="absolute right-0 bottom-12 w-48 bg-[rgba(20,20,20,0.7)] border border-white/6 rounded-lg p-2 shadow-2xl backdrop-blur-md text-white transform origin-bottom-right"
          onClick={(e) => e.stopPropagation()}
          style={{ pointerEvents: 'auto' }}
        >
          <div className="absolute right-4 -bottom-2 w-3 h-3 bg-[rgba(20,20,20,0.7)] rotate-45 border border-white/6" />

          {/* MAIN VIEW */}
          {settingsView === 'main' && (
            <div className="flex flex-col gap-1">
              <div className="px-2 py-1 text-sm font-semibold tracking-wide">Video Settings</div>

              <button
                className="flex items-center justify-between px-2 py-2 rounded hover:bg-white/5 transition-colors"
                onClick={() => setSettingsView('speed')}
              >
                <span className="text-sm">Playback Speed</span>
                <span className="text-xs text-muted-foreground">
                  {playbackSpeed === 1 ? 'Normal' : `${playbackSpeed}x`}
                </span>
              </button>

              <button
                className="flex items-center justify-between px-2 py-2 rounded hover:bg-white/5 transition-colors"
                onClick={() => setSettingsView('quality')}
              >
                <span className="text-sm">Quality</span>
                <span className="text-xs text-muted-foreground">{currentQuality}</span>
              </button>
            </div>
          )}

          {/* SPEED VIEW */}
          {settingsView === 'speed' && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center px-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 mr-2 text-white/80"
                  onClick={() => setSettingsView('main')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-semibold">Playback Speed</div>
              </div>

              <div className="px-1 py-1 flex flex-col gap-1">
                {playbackSpeeds.map((s) => (
                  <button
                    key={s}
                    className={`text-left px-2 py-2 rounded hover:bg-white/5 transition-colors ${
                      s === playbackSpeed ? 'bg-white/6 ring-1 ring-white/10' : ''
                    }`}
                    onClick={() => {
                      setPlaybackSpeed(s);
                      setOpen(false);
                      setSettingsView('main');
                    }}
                  >
                    {s === 1 ? 'Normal' : `${s}x`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* QUALITY VIEW */}
          {settingsView === 'quality' && (
            <div className="flex flex-col gap-1">
              <div className="flex items-center px-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 mr-2 text-white/80"
                  onClick={() => setSettingsView('main')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-semibold">Quality</div>
              </div>

              <div className="px-1 py-1 flex flex-col gap-1">
                {qualityOptions.map((q) => (
                  <button
                    key={q}
                    className={`text-left px-2 py-2 rounded hover:bg-white/5 transition-colors ${
                      q === currentQuality ? 'bg-white/6 ring-1 ring-white/10' : ''
                    }`}
                    onClick={() => {
                      handleQualityChange(q);
                      setOpen(false);
                      setSettingsView('main');
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>

              <p className="text-xs text-muted-foreground px-2 py-1">
                Note: switching quality requires multiple sources / HLS.
              </p>
            </div>
          )}
        </div>
      )}
      <style>{`
        .text-muted-foreground { color: rgba(255,255,255,0.78); }
      `}</style>
    </div>
  );
};

export default SettingsMenu;