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
    <div
      className="relative z-[999999]"
      style={{
        position: 'relative',
        pointerEvents: 'auto',
      }}
    >
      <DropdownMenu onOpenChange={(open) => !open && setSettingsView('main')}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/20 focus-visible:ring-0"
            onClick={(e) => { e.stopPropagation(); console.log("Settings button clicked!"); }} // Added console.log
          >
            <Settings className="h-5 w-5" />
            <span className="sr-only">Video Settings</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          forceMount
          className="fixed w-48 bg-primary text-primary-foreground border-border rounded-md z-[999999] p-1 shadow-lg backdrop-blur-sm"
          side="top"
          align="end"
          sideOffset={12}
          collisionPadding={8}
          style={{
            position: 'fixed', // ✅ critical: stays within fullscreen
          }}
        >
          {/* MAIN VIEW */}
          {settingsView === 'main' && (
            <>
              <DropdownMenuLabel className="text-primary-foreground">Video Settings</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  e.stopPropagation(); // Stop propagation
                  setSettingsView('speed');
                }}
                className="flex justify-between items-center text-primary-foreground hover:bg-secondary hover:text-foreground transition-colors duration-200"
              >
                <span>Playback Speed</span>
                <span className="text-muted-foreground">
                  {playbackSpeed === 1.0 ? 'Normal' : `${playbackSpeed}x`}
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  e.stopPropagation(); // Stop propagation
                  setSettingsView('quality');
                }}
                className="flex justify-between items-center text-primary-foreground hover:bg-secondary hover:text-foreground transition-colors duration-200"
              >
                <span>Quality</span>
                <span className="text-muted-foreground">{currentQuality}</span>
              </DropdownMenuItem>
            </>
          )}

          {/* SPEED VIEW */}
          {settingsView === 'speed' && (
            <>
              <DropdownMenuLabel className="flex items-center text-primary-foreground">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 mr-2 text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={(e) => { e.stopPropagation(); setSettingsView('main'); }} // Stop propagation
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                Playback Speed
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuRadioGroup
                value={playbackSpeed.toString()}
                onValueChange={(value) =>
                  setPlaybackSpeed(parseFloat(value))
                }
              >
                {playbackSpeeds.map((speed) => (
                  <DropdownMenuRadioItem
                    key={speed}
                    value={speed.toString()}
                    onSelect={(e) => e.stopPropagation()} // Stop propagation
                    className="text-primary-foreground hover:bg-secondary hover:text-foreground transition-colors duration-200"
                  >
                    {speed === 1.0 ? 'Normal' : `${speed}x`}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </>
          )}

          {/* QUALITY VIEW */}
          {settingsView === 'quality' && (
            <>
              <DropdownMenuLabel className="flex items-center text-primary-foreground">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 mr-2 text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={(e) => { e.stopPropagation(); setSettingsView('main'); }} // Stop propagation
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                Quality
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuRadioGroup
                value={currentQuality}
                onValueChange={handleQualityChange}
              >
                {qualityOptions.map((quality) => (
                  <DropdownMenuRadioItem
                    key={quality}
                    value={quality}
                    onSelect={(e) => e.stopPropagation()} // Stop propagation
                    className="text-primary-foreground hover:bg-secondary hover:text-foreground transition-colors duration-200"
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