import React, { useState, useEffect } from 'react';
import { Video, getProfileById, Profile } from '@/lib/video-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Link } from 'react-router-dom';

interface VideoCardProps {
  video: Video;
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const [creatorProfile, setCreatorProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchCreatorProfile = async () => {
      if (video.user_id) {
        try {
          const profile = await getProfileById(video.user_id);
          setCreatorProfile(profile);
        } catch (error) {
          console.error('Error fetching creator profile for video card:', error);
        }
      }
    };
    fetchCreatorProfile();
  }, [video.user_id]);

  return (
    <Link to={`/watch/${video.id}`} className="block">
      <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
        <CardContent className="p-0">
          <AspectRatio ratio={16 / 9}>
            <img
              src={video.thumbnail_url}
              alt={video.title}
              className="rounded-t-lg object-cover w-full h-full"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
          </AspectRatio>
        </CardContent>
        <CardHeader className="p-4">
          <CardTitle className="text-lg font-semibold line-clamp-2 mb-1">{video.title}</CardTitle>
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <CardDescription className="text-sm text-muted-foreground">
              {creatorProfile ? `${creatorProfile.first_name || ''} ${creatorProfile.last_name || ''}`.trim() || 'Unknown Creator' : 'Loading Creator...'}
            </CardDescription>
            <CardDescription className="text-sm text-muted-foreground">
              {video.views} views • {new Date(video.created_at).toLocaleDateString()}
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
};

export default VideoCard;