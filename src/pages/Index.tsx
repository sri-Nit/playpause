import React, { useState, useEffect } from 'react';
import { getVideos, Video } from '@/lib/video-store';
import VideoCard from '@/components/VideoCard';
// Removed VideoPlayer and Dialog imports as they are no longer needed here

const Index = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  // Removed selectedVideo state as it's no longer needed

  useEffect(() => {
    setVideos(getVideos());
  }, []);

  // Removed handleVideoClick and handleCloseDialog as they are no longer needed

  return (
    <div className="min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Explore Videos</h1>
      {videos.length === 0 ? (
        <div className="text-center text-muted-foreground">
          No videos uploaded yet. Go to "Upload Video" to add some!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} /> {/* No onClick prop needed */}
          ))}
        </div>
      )}
      {/* Removed Dialog component */}
    </div>
  );
};

export default Index;