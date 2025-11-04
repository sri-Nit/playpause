import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSession } from '@/components/SessionContextProvider';
import { toast } from 'sonner';
import {
  getProfileById,
  getCreatorVideos,
  isFollowing,
  addSubscription,
  removeSubscription,
  getOrCreateConversation,
  Profile,
  Video,
} from '@/lib/video-store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User as LucideUser, Plus, Check, MessageSquare, VideoIcon } from 'lucide-react';
import VideoCard from '@/components/VideoCard';

const CreatorProfilePage = () => {
  const { id: creatorId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading: isSessionLoading } = useSession();
  const [creatorProfile, setCreatorProfile] = useState<Profile | null>(null);
  const [creatorVideos, setCreatorVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowingCreator, setIsFollowingCreator] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false); // For follow/unfollow loading state

  const fetchCreatorData = useCallback(async () => {
    if (!creatorId) {
      setError('Creator ID is missing.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const profile = await getProfileById(creatorId);
      if (!profile) {
        setError('Creator profile not found.');
        setIsLoading(false);
        return;
      }
      setCreatorProfile(profile);

      // Fetch all videos for the creator, then filter for published ones
      const allVideos = await getCreatorVideos(creatorId);
      const publishedVideos = allVideos.filter(video => video.status === 'published');
      setCreatorVideos(publishedVideos);

      if (user && user.id !== creatorId) {
        const followingStatus = await isFollowing(user.id, creatorId);
        setIsFollowingCreator(followingStatus);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch creator profile.');
      console.error('Error fetching creator profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, [creatorId, user]);

  useEffect(() => {
    if (!isSessionLoading) {
      fetchCreatorData();
    }
  }, [isSessionLoading, fetchCreatorData]);

  const handleFollowToggle = async () => {
    if (!user) {
      toast.error('You must be logged in to join a crew.');
      return;
    }
    if (!creatorProfile) {
      toast.error('Creator profile not found.');
      return;
    }
    if (user.id === creatorProfile.id) {
      toast.info("You cannot join your own crew.");
      return;
    }

    setIsSubscribing(true);
    try {
      if (isFollowingCreator) {
        await removeSubscription(user.id, creatorProfile.id);
        setIsFollowingCreator(false);
        toast.success(`Left ${creatorProfile.first_name || 'creator'}'s crew.`);
      } else {
        await addSubscription(user.id, creatorProfile.id);
        setIsFollowingCreator(true);
        toast.success(`Joined ${creatorProfile.first_name || 'creator'}'s crew!`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update crew status.');
      console.error(err);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleInitiateMessage = async () => {
    if (!user) {
      toast.error('You must be logged in to send messages.');
      return;
    }
    if (!creatorProfile) {
      toast.error('Creator profile not found.');
      return;
    }
    if (user.id === creatorProfile.id) {
      toast.info("You cannot message yourself.");
      return;
    }

    try {
      const conversation = await getOrCreateConversation(user.id, creatorProfile.id);
      if (conversation) {
        if (conversation.status === 'blocked') {
          toast.error('This user does not accept messages.');
        } else if (conversation.status === 'pending') {
          toast.info('Message request sent! The creator needs to accept it.');
          navigate('/messages', { state: { conversationId: conversation.id } });
        } else { // 'accepted'
          toast.success('Conversation opened!');
          navigate('/messages', { state: { conversationId: conversation.id } });
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to initiate message.');
      console.error('Error initiating message:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl flex items-center justify-center h-[calc(100vh-140px)]">
        <p className="text-lg text-muted-foreground">Loading creator profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-4xl flex items-center justify-center h-[calc(100vh-140px)]">
        <div className="text-center text-destructive-foreground bg-destructive/10 border border-destructive p-6 rounded-md">
          <h3 className="text-xl font-semibold mb-2">Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!creatorProfile) {
    return (
      <div className="container mx-auto p-4 max-w-4xl flex items-center justify-center h-[calc(100vh-140px)]">
        <p className="text-lg text-muted-foreground">Creator profile not found.</p>
      </div>
    );
  }

  const isOwnProfile = user && user.id === creatorProfile.id;

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="mb-8 shadow-lg border-none">
        <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start space-y-6 sm:space-y-0 sm:space-x-8">
          <Avatar className="h-28 w-28 sm:h-32 sm:w-32 border-2 border-primary/50">
            <AvatarImage src={creatorProfile.avatar_url || undefined} alt={creatorProfile.first_name || 'Creator'} />
            <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
              <LucideUser className="h-16 w-16" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center sm:text-left">
            <CardTitle className="text-4xl font-extrabold leading-tight mb-2">
              {creatorProfile.first_name} {creatorProfile.last_name}
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground mt-1">
              {creatorVideos.length} Published Videos
            </CardDescription>
            {/* Placeholder for a creator bio - can be added to profile schema later */}
            <p className="text-base text-foreground mt-4 max-w-prose">
              {/* This is a placeholder for the creator's bio. A compelling bio can tell viewers more about the creator's content and personality. */}
            </p>

            {!isOwnProfile && user && (
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mt-6">
                <Button
                  variant={isFollowingCreator ? "secondary" : "default"}
                  onClick={handleFollowToggle}
                  disabled={isSubscribing}
                  className="min-w-[120px]"
                >
                  {isSubscribing ? '...' : isFollowingCreator ? <><Check className="mr-2 h-4 w-4" /> Joined Crew</> : <><Plus className="mr-2 h-4 w-4" /> Join Crew</>}
                </Button>
                <Button variant="outline" onClick={handleInitiateMessage} className="min-w-[120px]">
                  <MessageSquare className="mr-2 h-4 w-4" /> Message
                </Button>
              </div>
            )}
            {isOwnProfile && (
              <Button className="mt-6" onClick={() => navigate('/dashboard')}>
                <VideoIcon className="mr-2 h-4 w-4" /> Go to My Dashboard
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <h2 className="text-3xl font-bold mb-6 mt-10 text-center sm:text-left">
        Published Videos by {creatorProfile.first_name}
      </h2>
      {creatorVideos.length === 0 ? (
        <div className="text-center text-muted-foreground py-16 border border-dashed rounded-lg bg-muted/20">
          <p className="text-lg">
            {isOwnProfile ? "You haven't published any videos yet." : "This creator hasn't published any videos yet."}
          </p>
          {isOwnProfile && (
            <Button onClick={() => navigate('/upload')} className="mt-6">
              <Plus className="mr-2 h-4 w-4" /> Upload Your First Video
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {creatorVideos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CreatorProfilePage;