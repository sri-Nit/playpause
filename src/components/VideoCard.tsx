import React from 'react';
import { Video } from '@/lib/video-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Link } from 'react-router-dom'; // Import Link

interface VideoCardProps {
  video: Video;
  // onClick: (video: Video) => void; // No longer needed
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => { // Removed onClick from props
  return (
    <Link to={`/videos/${video.id}`}> {/* Use Link to navigate */}
      <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
        <CardContent className="p-0">
          <AspectRatio ratio={16 / 9}>
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="rounded-t-lg object-cover w-full h-full"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg'; // Fallback image
              }}
            />
          </AspectRatio>
        </CardContent>
        <CardHeader className="p-4">
          <CardTitle className="text-lg font-semibold line-clamp-2">{video.title}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {new Date(video.uploadDate).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
};

export default VideoCard;