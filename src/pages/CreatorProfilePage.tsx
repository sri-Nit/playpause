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
    return <div className="text-center text-muted-foreground py-10">Loading creator profile...</div>;
  }

  if (error) {
    return <div className="text-center text-destructive-foreground bg-destructive p-4 rounded-md">{error}</div>;
  }

  if (!creatorProfile) {
    return <div className="text-center text-muted-foreground">Creator profile not found.</div>;
  }

  const isOwnProfile = user && user.id === creatorProfile.id;

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="mb-8">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={creatorProfile.avatar_url || undefined} alt={creatorProfile.first_name || 'Creator'} />
            <AvatarFallback>
              <LucideUser className="h-12 w-12 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center sm:text-left">
            <CardTitle className="text-3xl font-bold">
              {creatorProfile.first_name} {creatorProfile.last_name}
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-1">
              {creatorVideos.length} Published Videos
            </CardDescription>
            {!isOwnProfile && user && (
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mt-4">
                <Button
                  variant={isFollowingCreator ? "secondary" : "default"}
                  onClick={handleFollowToggle}
                  disabled={isSubscribing}
                >
                  {isSubscribing ? '...' : isFollowingCreator ? <><Check className="mr-2 h-4 w-4" /> Joined Crew</> : <><Plus className="mr-2 h-4 w-4" /> Join Crew</>}
                </Button>
                <Button variant="outline" onClick={handleInitiateMessage}>
                  <MessageSquare className="mr-2 h-4 w-4" /> Message
                </Button>
              </div>
            )}
            {isOwnProfile && (
              <Button variant="outline" className="mt-4" onClick={() => navigate('/dashboard')}>
                <VideoIcon className="mr-2 h-4 w-4" /> Go to My Dashboard
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold mb-4">Published Videos by {creatorProfile.first_name}</h2>
      {creatorVideos.length === 0 ? (
        <div className="text-center text-muted-foreground py-10">
          {isOwnProfile ? "You haven't published any videos yet." : "This creator hasn't published any videos yet."}
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