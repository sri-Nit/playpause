import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSearchVideos } from '@/hooks/use-video-data'; // Import the new hook
import VideoCard from '@/components/VideoCard';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('query') || '';

  const { data: videos = [], isLoading, error } = useSearchVideos(query); // Use the useSearchVideos hook

  if (isLoading) {
    return <div className="text-center text-muted-foreground">Searching for "{query}"...</div>;
  }

  if (error) {
    return <div className="text-center text-destructive-foreground bg-destructive p-4 rounded-md">Error: {error.message}</div>;
  }

  return (
    <div className="min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Search Results for "{query}"</h1>

      {videos.length === 0 ? (
        <div className="text-center text-muted-foreground">
          No videos found matching "{query}".
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

export default SearchResults;