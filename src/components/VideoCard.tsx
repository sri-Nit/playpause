import React from 'react';
import { Video } from '@/lib/video-store'; // Video now includes creator_profiles
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as LucideUser } from 'lucide-react';

interface VideoCardProps {
  video: Video;
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  // Creator profile is now directly available on the video object
  const creatorProfile = video.creator_profiles;

  return (
    <Link to={`/watch/${video.id}`} className="block">
      <Card className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.03] border-border bg-card">
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
          <CardTitle className="text-lg font-semibold line-clamp-2 mb-1 text-foreground">{video.title}</CardTitle>
          <div className="flex items-center justify-between text-sm text-muted-foreground mt-1">
            <Link to={`/profile/${video.user_id}`} className="flex items-center space-x-2 hover:underline hover:text-foreground transition-colors duration-200">
              <Avatar className="h-6 w-6">
                <AvatarImage src={creatorProfile?.avatar_url || undefined} alt={creatorProfile?.first_name || 'Creator'} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <LucideUser className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>
              <CardDescription className="text-sm text-muted-foreground">
                {creatorProfile ? `${creatorProfile.first_name || ''} ${creatorProfile.last_name || ''}`.trim() || 'Unknown Creator' : 'Unknown Creator'}
              </CardDescription>
            </Link>
            <CardDescription className="text-sm text-muted-foreground">
              {video.video_stats?.[0]?.views || 0} views • {new Date(video.created_at).toLocaleDateString()}
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
};

export default VideoCard;