import React, { useState, useEffect } from 'react';
import { getVideos, Video } from '@/lib/video-store';
import VideoCard from '@/components/VideoCard';
import VideoPlayer from '@/components/VideoPlayer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const Index = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchVideos = async () => {
      const fetchedVideos = await getVideos();
      setVideos(fetchedVideos);
      setFilteredVideos(fetchedVideos);
    };
    fetchVideos();
  }, []);

  useEffect(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    const results = videos.filter(
      (video) =>
        video.title.toLowerCase().includes(lowercasedSearchTerm) ||
        (video.description && video.description.toLowerCase().includes(lowercasedSearchTerm))
    );
    setFilteredVideos(results);
  }, [searchTerm, videos]);

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video);
  };

  const handleCloseDialog = () => {
    setSelectedVideo(null);
  };

  return (
    <div className="min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Explore Videos</h1>

      {/* Search Bar */}
      <div className="relative mb-8 max-w-xl mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search videos by title or description..."
          className="w-full pl-10 pr-4 py-2 rounded-md border"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredVideos.length === 0 ? (
        <div className="text-center text-muted-foreground">
          {searchTerm ? 'No videos found matching your search.' : 'No videos uploaded yet. Go to "Upload Video" to add some!'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVideos.map((video) => (
            <VideoCard key={video.id} video={video} onClick={handleVideoClick} />
          ))}
        </div>
      )}

      <Dialog open={!!selectedVideo} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[800px] p-0 border-none bg-transparent shadow-none">
          {selectedVideo && (
            <div className="bg-card rounded-lg p-6">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-2xl font-bold">{selectedVideo.title}</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  {selectedVideo.description}
                </DialogDescription>
              </DialogHeader>
              <VideoPlayer videoUrl={selectedVideo.video_url} title={selectedVideo.title} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;