import React, { useRef, useEffect, useState } from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  thumbnailUrl: string;
  onProgressThresholdMet: (videoId: string) => void;
  videoId: string;
  playbackSpeed: number; // New prop for playback speed
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, title, thumbnailUrl, onProgressThresholdMet, videoId, playbackSpeed }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasMetThreshold, setHasMetThreshold] = useState(false);

  useEffect(() => {
    setHasMetThreshold(false);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.playbackRate = playbackSpeed; // Apply initial playback speed
      videoRef.current.play().catch(error => {
        console.warn("Autoplay prevented:", error);
      });
    }
  }, [videoId, videoUrl]);

  // Effect to update playback speed when the prop changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

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
          poster={thumbnailUrl}
          onTimeUpdate={handleTimeUpdate}
          autoPlay
          muted
          playsInline
        >
          Your browser does not support the video tag.
        </video>
      </AspectRatio>
    </div>
  );
};

export default VideoPlayer;