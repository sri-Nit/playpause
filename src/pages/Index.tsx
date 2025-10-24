import React from 'react';
import { useVideos } from '@/hooks/use-video-data'; // Import the new hook
import VideoCard from '@/components/VideoCard';

const Index = () => {
  const { data: videos = [], isLoading, error } = useVideos(); // Use the useVideos hook

  if (isLoading) {
    return <div className="text-center text-muted-foreground">Loading videos...</div>;
  }

  if (error) {
    return <div className="text-center text-destructive-foreground bg-destructive p-4 rounded-md">Error: {error.message}</div>;
  }

  return (
    <div className="min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Explore Videos</h1>

      {videos.length === 0 ? (
        <div className="text-center text-muted-foreground">
          No videos uploaded yet. Go to "Upload Video" to add some!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Index;