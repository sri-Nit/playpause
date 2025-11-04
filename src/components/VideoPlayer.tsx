import React, { useRef, useEffect, useState } from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  thumbnailUrl: string; // New prop for thumbnail
  onProgressThresholdMet: (videoId: string) => void;
  videoId: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, title, thumbnailUrl, onProgressThresholdMet, videoId }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasMetThreshold, setHasMetThreshold] = useState(false);

  useEffect(() => {
    setHasMetThreshold(false);
    // Attempt to play the video when component mounts or videoId/videoUrl changes
    if (videoRef.current) {
      videoRef.current.load(); // Ensure video element is ready to load new source
      videoRef.current.play().catch(error => {
        // Autoplay might be blocked by browser policies (e.g., no user interaction, not muted)
        console.warn("Autoplay prevented:", error);
        // Optionally, you could show a play button here if autoplay fails
      });
    }
  }, [videoId, videoUrl]); // Re-run effect if videoId or videoUrl changes

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
          poster={thumbnailUrl} // Use the actual thumbnail URL
          onTimeUpdate={handleTimeUpdate}
          autoPlay // Play automatically
          muted // Start muted to increase autoplay success rate
          playsInline // Important for iOS devices
        >
          Your browser does not support the video tag.
        </video>
      </AspectRatio>
    </div>
  );
};

export default VideoPlayer;