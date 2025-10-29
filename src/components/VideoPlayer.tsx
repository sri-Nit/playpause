import React, { useRef, useEffect, useState } from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  onProgressThresholdMet: (videoId: string) => void; // New callback prop
  videoId: string; // New prop to pass video ID
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, title, onProgressThresholdMet, videoId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasMetThreshold, setHasMetThreshold] = useState(false);

  useEffect(() => {
    // Reset hasMetThreshold when videoId changes
    setHasMetThreshold(false);
  }, [videoId]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video && !hasMetThreshold) {
      const percentageWatched = (video.currentTime / video.duration) * 100;
      if (percentageWatched >= 50) {
        setHasMetThreshold(true);
        onProgressThresholdMet(videoId);
      }
    }
  };

  return (
    <div className="w-full">
      <AspectRatio ratio={16 / 9}>
        <video
          ref={videoRef}
          controls
          src={videoUrl}
          title={title}
          className="w-full h-full rounded-md object-cover"
          poster="/placeholder.svg" // Optional: A poster image for the video
          onTimeUpdate={handleTimeUpdate}
        >
          Your browser does not support the video tag.
        </video>
      </AspectRatio>
    </div>
  );
};

export default VideoPlayer;