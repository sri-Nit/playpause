import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchVideos, Video } from '@/lib/video-store';
import VideoCard from '@/components/VideoCard';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('query') || '';
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query) {
        setVideos([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const fetchedVideos = await searchVideos(query);
        setVideos(fetchedVideos);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch search results.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSearchResults();
  }, [query]);

  if (isLoading) {
    return <div className="text-center text-muted-foreground">Searching for "{query}"...</div>;
  }

  if (error) {
    return <div className="text-center text-destructive-foreground bg-destructive p-4 rounded-md">{error}</div>;
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