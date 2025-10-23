import React from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, title }) => {
  return (
    <div className="w-full">
      <AspectRatio ratio={16 / 9}>
        <video
          controls
          src={videoUrl}
          title={title}
          className="w-full h-full rounded-md object-cover"
          poster="/placeholder.svg" // Optional: A poster image for the video
        >
          Your browser does not support the video tag.
        </video>
      </AspectRatio>
    </div>
  );
};

export default VideoPlayer;