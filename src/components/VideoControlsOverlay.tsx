import React, { useState, useEffect, useRef } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import VideoPlayer from './VideoPlayer';

interface VideoControlsOverlayProps {
  videoUrl: string;
  title: string;
  thumbnailUrl: string;
  onProgressThresholdMet: (videoId: string) => void;
  videoId: string;
}

const playbackSpeeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

const VideoControlsOverlay: React.FC<VideoControlsOverlayProps> = ({
  videoUrl,
  title,
  thumbnailUrl,
  onProgressThresholdMet,
  videoId,
}) => {
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  const handleSpeedChange = (speed: string) => {
    setPlaybackSpeed(parseFloat(speed));
  };

  return (
    <div className="relative w-full">
      <VideoPlayer
        videoUrl={videoUrl}
        title={title}
        thumbnailUrl={thumbnailUrl}
        onProgressThresholdMet={onProgressThresholdMet}
        videoId={videoId}
        playbackSpeed={playbackSpeed}
      />
      <div className="absolute bottom-4 right-4 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <Settings className="h-5 w-5" />
              <span className="sr-only">Video Settings</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            <DropdownMenuLabel>Playback Speed</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={playbackSpeed.toString()} onValueChange={handleSpeedChange}>
              {playbackSpeeds.map((speed) => (
                <DropdownMenuRadioItem key={speed} value={speed.toString()}>
                  {speed === 1.0 ? 'Normal' : `${speed}x`}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            {/*
              NOTE: Video quality switching is not possible with a single video URL.
              It would require multiple video sources (e.g., different video_url for each resolution)
              and a more complex video player implementation (e.g., using HLS/DASH).
            */}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default VideoControlsOverlay;