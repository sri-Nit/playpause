import React from 'react';
import { Settings, ChevronLeft } from 'lucide-react';
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

interface SettingsMenuProps {
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;
  currentQuality: string;
  handleQualityChange: (quality: string) => void;
  settingsView: 'main' | 'speed' | 'quality';
  setSettingsView: (view: 'main' | 'speed' | 'quality') => void;
}

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
  return (
    // wrapper must be relative so the content can be absolutely positioned inside the player subtree
    <div
      className="relative z-50"
      onClick={(e) => e.stopPropagation()} // stop clicks bubbling to player (which may hide controls)
      style={{ pointerEvents: 'auto' }}
    >
      <DropdownMenu onOpenChange={(open) => !open && setSettingsView('main')}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 focus-visible:ring-0"
            onClick={(e) => { e.stopPropagation(); }}
            aria-haspopup="true"
            aria-expanded={settingsView !== 'main' ? true : undefined}
          >
            <Settings className="h-5 w-5" />
            <span className="sr-only">Video Settings</span>
          </Button>
        </DropdownMenuTrigger>

        {/* Render the content in-place (no portal/fixed). This keeps the menu inside the player DOM
            so it remains visible and positioned correctly in fullscreen.
            If your DropdownMenu supports a different prop name for disabling portal, use that name.
        */}
        <DropdownMenuContent
          forceMount
          portalled={false} /* ensure the content renders where the trigger is (Radix-style prop name) */
          className="absolute right-0 bottom-12 w-48 bg-black/80 text-white border-none rounded-md z-50 p-1 shadow-lg backdrop-blur-sm"
          side="top"
          align="end"
          sideOffset={8}
          collisionPadding={8}
        >
          {settingsView === 'main' && (
            <>
              <DropdownMenuLabel>Video Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSettingsView('speed');
                }}
                className="flex justify-between items-center"
              >
                <span>Playback Speed</span>
                <span className="text-muted-foreground">
                  {playbackSpeed === 1.0 ? 'Normal' : `${playbackSpeed}x`}
                </span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSettingsView('quality');
                }}
                className="flex justify-between items-center"
              >
                <span>Quality</span>
                <span className="text-muted-foreground">{currentQuality}</span>
              </DropdownMenuItem>
            </>
          )}

          {settingsView === 'speed' && (
            <>
              <DropdownMenuLabel className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 mr-2"
                  onClick={(e) => { e.stopPropagation(); setSettingsView('main'); }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                Playback Speed
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={playbackSpeed.toString()}
                onValueChange={(value) => setPlaybackSpeed(parseFloat(value))}
              >
                {playbackSpeeds.map((speed) => (
                  <DropdownMenuRadioItem
                    key={speed}
                    value={speed.toString()}
                    onSelect={(e) => e.stopPropagation()}
                  >
                    {speed === 1.0 ? 'Normal' : `${speed}x`}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </>
          )}

          {settingsView === 'quality' && (
            <>
              <DropdownMenuLabel className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 mr-2"
                  onClick={(e) => { e.stopPropagation(); setSettingsView('main'); }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                Quality
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={currentQuality} onValueChange={handleQualityChange}>
                {qualityOptions.map((quality) => (
                  <DropdownMenuRadioItem
                    key={quality}
                    value={quality}
                    onSelect={(e) => e.stopPropagation()}
                  >
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
    </div>
  );
};

export default SettingsMenu;