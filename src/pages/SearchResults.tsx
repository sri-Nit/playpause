import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchVideos, getVideoAnalytics, Video } from '@/lib/video-store';
import VideoCard from '@/components/VideoCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type SortOrder = 'latest' | 'popular' | 'duration_asc' | 'duration_desc';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('query') || '';
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('latest');

  const fetchSearchResults = useCallback(async () => {
    if (!query) {
      setVideos([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      let fetchedVideos = await searchVideos(query);

      if (sortOrder === 'popular') {
        const videoIds = fetchedVideos.map(v => v.id);
        const analyticsMap = await getVideoAnalytics(videoIds);
        fetchedVideos.sort((a, b) => {
          const likesA = analyticsMap[a.id]?.likes || 0;
          const likesB = analyticsMap[b.id]?.likes || 0;
          return likesB - likesA; // Descending order for popularity
        });
      } else if (sortOrder === 'duration_asc') {
        fetchedVideos.sort((a, b) => (a.duration_seconds || 0) - (b.duration_seconds || 0)); // Ascending duration
      } else if (sortOrder === 'duration_desc') {
        fetchedVideos.sort((a, b) => (b.duration_seconds || 0) - (a.duration_seconds || 0)); // Descending duration
      } else { // 'latest' is default and already handled by searchVideos
        // No additional client-side sort needed as searchVideos already orders by created_at DESC
      }

      setVideos(fetchedVideos);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch search results.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [query, sortOrder]); // Added sortOrder to dependencies

  useEffect(() => {
    fetchSearchResults();
  }, [fetchSearchResults]);

  if (isLoading) {
    return <div className="text-center text-muted-foreground py-10">Searching for "{query}"...</div>;
  }

  if (error) {
    return <div className="text-center text-destructive-foreground bg-destructive p-4 rounded-md">{error}</div>;
  }

  return (
    <div className="min-h-screen p-4 bg-background">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-center text-foreground">Search Results for "{query}"</h1>
        <div className="flex items-center space-x-2">
          <span className="text-muted-foreground text-sm">Sort by:</span>
          <Select value={sortOrder} onValueChange={(value: SortOrder) => setSortOrder(value)}>
            <SelectTrigger className="w-[180px] bg-card text-foreground border-border">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-card text-foreground border-border">
              <SelectItem value="latest">Latest</SelectItem>
              <SelectItem value="popular">Popularity</SelectItem>
              <SelectItem value="duration_asc">Duration (Shortest First)</SelectItem>
              <SelectItem value="duration_desc">Duration (Longest First)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {videos.length === 0 ? (
        <div className="text-center text-muted-foreground py-10">
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