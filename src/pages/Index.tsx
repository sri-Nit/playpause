import React, { useState, useEffect } from 'react';
import { getVideos, Video } from '@/lib/video-store';
import VideoCard from '@/components/VideoCard';
import VideoPlayer from '@/components/VideoPlayer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const Index = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    setVideos(getVideos());
  }, []);

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video);
  };

  const handleCloseDialog = () => {
    setSelectedVideo(null);
  };

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
              <VideoPlayer videoUrl={selectedVideo.videoUrl} title={selectedVideo.title} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;