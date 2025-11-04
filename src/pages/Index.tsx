import React, { useState, useEffect } from 'react';
import { getVideos, Video } from '@/lib/video-store';
import VideoCard from '@/components/VideoCard';

const Index = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedVideos = await getVideos(); // getVideos already fetches published videos ordered by created_at DESC
        setVideos(fetchedVideos);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch videos.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, []); // No dependencies needed as sorting is removed

  if (isLoading) {
    return <div className="text-center text-muted-foreground">Loading videos...</div>;
  }

  if (error) {
    return <div className="text-center text-destructive-foreground bg-destructive p-4 rounded-md">{error}</div>;
  }

  return (
    <div className="min-h-screen p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-center">Explore Videos</h1>
        {/* Sorting functionality removed from home page */}
      </div>

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