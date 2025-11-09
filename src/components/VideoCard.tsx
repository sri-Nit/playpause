import React from 'react';
import { Video } from '@/lib/video-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as LucideUser } from 'lucide-react';

interface VideoCardProps {
  video: Video;
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const creatorProfile = video.creator_profiles;

  return (
    <Link to={`/watch/${video.id}`} className="block">
      <Card className="cursor-pointer bg-card border border-border rounded-lg overflow-hidden shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 ease-in-out group">
        <CardContent className="p-0 relative">
          <AspectRatio ratio={16 / 9}>
            <img
              src={video.thumbnail_url}
              alt={video.title}
              className="rounded-t-lg object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
              {/* Optional: Add play icon or duration here on hover */}
            </div>
          </AspectRatio>
        </CardContent>
        <CardHeader className="p-4">
          <CardTitle className="text-lg font-semibold line-clamp-2 mb-1 text-foreground group-hover:text-primary transition-colors duration-200">
            {video.title}
          </CardTitle>
          <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
            <Link to={`/profile/${video.user_id}`} className="flex items-center space-x-2 hover:underline group-hover:text-primary/80 transition-colors duration-200" onClick={(e) => e.stopPropagation()}>
              <Avatar className="h-7 w-7 border border-border">
                <AvatarImage src={creatorProfile?.avatar_url || undefined} alt={creatorProfile?.first_name || 'Creator'} />
                <AvatarFallback className="bg-secondary text-secondary-foreground">
                  <LucideUser className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <CardDescription className="text-sm text-muted-foreground group-hover:text-primary/80">
                {creatorProfile ? `${creatorProfile.first_name || ''} ${creatorProfile.last_name || ''}`.trim() || 'Unknown Creator' : 'Unknown Creator'}
              </CardDescription>
            </Link>
            <CardDescription className="text-sm text-muted-foreground">
              {video.video_stats?.views || 0} views • {new Date(video.created_at).toLocaleDateString()}
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
};

export default VideoCard;