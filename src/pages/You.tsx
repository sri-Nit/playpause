import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User as LucideUser } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getLikedVideosByUser, getWatchHistory, getSubscribedChannelVideos, Video, WatchHistory as WatchHistoryEntry } from '@/lib/video-store';
import VideoCard from '@/components/VideoCard';
import { useNavigate } from 'react-router-dom';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  updated_at: string | null;
}

const YouPage = () => {
  const { user, isLoading: isSessionLoading } = useSession();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // States for new sections
  const [likedVideos, setLikedVideos] = useState<Video[]>([]);
  const [watchHistory, setWatchHistory] = useState<WatchHistoryEntry[]>([]);
  const [subscribedVideos, setSubscribedVideos] = useState<Video[]>([]);
  const [isContentLoading, setIsContentLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (user) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile data.');
      } else if (data) {
        setProfile(data);
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setAvatarUrl(data.avatar_url || '');
      } else {
        // Profile not found, create a new one
        console.log('Profile not found for user, creating a new one.');
        const { data: newProfileData, error: insertError } = await supabase
          .from('profiles')
          .insert({ id: user.id, first_name: user.user_metadata.first_name || null, last_name: user.user_metadata.last_name || null })
          .select('*')
          .single();

        if (insertError) {
          console.error('Error creating new profile:', insertError);
          toast.error('Failed to create new profile.');
        } else if (newProfileData) {
          setProfile(newProfileData);
          setFirstName(newProfileData.first_name || '');
          setLastName(newProfileData.last_name || '');
          setAvatarUrl(newProfileData.avatar_url || '');
          toast.success('New profile created!');
        }
      }
    }
  }, [user]);

  const fetchLikedVideos = useCallback(async () => {
    if (user) {
      try {
        const videos = await getLikedVideosByUser(user.id);
        setLikedVideos(videos);
      } catch (error: any) {
        toast.error(`Failed to load liked videos: ${error.message}`);
        console.error('Error fetching liked videos:', error);
      }
    }
  }, [user]);

  const fetchWatchHistory = useCallback(async () => {
    if (user) {
      try {
        const history = await getWatchHistory(user.id);
        setWatchHistory(history);
      } catch (error: any) {
        toast.error(`Failed to load watch history: ${error.message}`);
        console.error('Error fetching watch history:', error);
      }
    }
  }, [user]);

  const fetchSubscribedVideos = useCallback(async () => {
    if (user) {
      try {
        const videos = await getSubscribedChannelVideos(user.id);
        setSubscribedVideos(videos);
      } catch (error: any) {
        toast.error(`Failed to load subscribed videos: ${error.message}`);
        console.error('Error fetching subscribed videos:', error);
      }
    }
  }, [user]);

  useEffect(() => {
    if (!isSessionLoading && !user) {
      navigate('/auth');
      toast.error('You must be logged in to view your profile.');
      return;
    }

    if (user) {
      setIsContentLoading(true);
      fetchProfile();
      if (activeTab === 'liked') {
        fetchLikedVideos();
      } else if (activeTab === 'history') {
        fetchWatchHistory();
      } else if (activeTab === 'subscribed') {
        fetchSubscribedVideos();
      }
      setIsContentLoading(false);
    }
  }, [user, isSessionLoading, navigate, activeTab, fetchProfile, fetchLikedVideos, fetchWatchHistory, fetchSubscribedVideos]);

  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setAvatarFile(event.target.files[0]);
    } else {
      setAvatarFile(null);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) throw new Error('User not authenticated.');

    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
      });

    if (error) {
      throw new Error(`Failed to upload avatar: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    setIsUpdating(true);
    const loadingToastId = toast.loading('Updating profile...');

    try {
      let newAvatarUrl = avatarUrl;

      if (avatarFile) {
        toast.loading('Uploading new avatar...', { id: loadingToastId });
        newAvatarUrl = await uploadAvatar(avatarFile);
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          avatar_url: newAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        throw new Error(error.message);
      }

      setAvatarUrl(newAvatarUrl);
      setAvatarFile(null);
      toast.success('Profile updated successfully!', { id: loadingToastId });
      fetchProfile(); // Refresh profile data
    } catch (error: any) {
      toast.error(`Failed to update profile: ${error.message}`, { id: loadingToastId });
      console.error('Profile update error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isSessionLoading || !user) {
    return <div className="text-center text-muted-foreground py-10">Loading profile...</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 text-center">Your Account</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile Details</TabsTrigger>
          <TabsTrigger value="liked">Liked Videos</TabsTrigger>
          <TabsTrigger value="history">Watch History</TabsTrigger>
          <TabsTrigger value="subscribed">Joined Crews</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Your Profile</CardTitle>
              <CardDescription>Manage your account details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarUrl || user.user_metadata.avatar_url || undefined} alt={user.email || 'User'} />
                  <AvatarFallback>
                    <LucideUser className="h-10 w-10 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <div className="text-center sm:text-left">
                  <p className="text-lg font-semibold">{user.email}</p>
                  <p className="text-sm text-muted-foreground">Member since: {new Date(user.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First Name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last Name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="avatarFile">Upload Avatar</Label>
                  <Input
                    id="avatarFile"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                  />
                  {avatarFile && <p className="text-sm text-muted-foreground">Selected: {avatarFile.name}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="avatarUrl">Avatar URL (or upload above)</Label>
                  <Input
                    id="avatarUrl"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    disabled={!!avatarFile}
                  />
                </div>
                <Button onClick={handleUpdateProfile} disabled={isUpdating}>
                  {isUpdating ? 'Updating...' : 'Update Profile'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="liked" className="mt-6">
          <h2 className="text-2xl font-bold mb-4">Your Liked Videos</h2>
          {isContentLoading ? (
            <div className="text-center text-muted-foreground py-10">Loading liked videos...</div>
          ) : likedVideos.length === 0 ? (
            <div className="text-center text-muted-foreground">You haven't liked any videos yet.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {likedVideos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <h2 className="text-2xl font-bold mb-4">Your Watch History</h2>
          {isContentLoading ? (
            <div className="text-center text-muted-foreground py-10">Loading watch history...</div>
          ) : watchHistory.length === 0 ? (
            <div className="text-center text-muted-foreground">You haven't watched any videos yet. Start exploring!</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {watchHistory.map((entry) => (
                <VideoCard key={entry.id} video={entry.videos} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="subscribed" className="mt-6">
          <h2 className="text-2xl font-bold mb-4">Videos from Joined Crews</h2>
          {isContentLoading ? (
            <div className="text-center text-muted-foreground py-10">Loading videos from joined crews...</div>
          ) : subscribedVideos.length === 0 ? (
            <div className="text-center text-muted-foreground">You haven't joined any crews yet, or they haven't uploaded videos.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {subscribedVideos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default YouPage;