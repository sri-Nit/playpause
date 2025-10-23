import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getVideoById, Video } from '@/lib/video-store';
import VideoPlayer from '@/components/VideoPlayer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const VideoDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [video, setVideo] = useState<Video | null>(null);

  useEffect(() => {
    if (id) {
      const foundVideo = getVideoById(id);
      setVideo(foundVideo || null);
    }
  }, [id]);

  if (!video) {
    return (
      <div className="container mx-auto p-4 text-center text-muted-foreground">
        Video not found.
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <VideoPlayer videoUrl={video.videoUrl} title={video.title} />
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">{video.title}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Uploaded on {new Date(video.uploadDate).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Separator className="my-4" />
              <p className="text-base text-foreground">{video.description || 'No description provided.'}</p>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          {/* Placeholder for related videos or comments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Related Videos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Coming soon...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VideoDetail;