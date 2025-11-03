import React, { useEffect, useState } from 'react';
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

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  updated_at: string | null;
}

const ProfilePage = () => {
  const { user, isLoading } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null); // New state for avatar file
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          toast.error('Failed to load profile data.');
        } else if (data) {
          setProfile(data);
          setFirstName(data.first_name || '');
          setLastName(data.last_name || '');
          setAvatarUrl(data.avatar_url || '');
        }
      }
    };

    if (!isLoading && user) {
      fetchProfile();
    }
  }, [user, isLoading]);

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
    const filePath = `${user.id}/${fileName}`; // Store avatars in a user-specific folder

    const { data, error } = await supabase.storage
      .from('avatars') // Use 'avatars' bucket
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true, // Allow overwriting existing avatar for the user
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

      setAvatarUrl(newAvatarUrl); // Update local state with new URL
      setAvatarFile(null); // Clear file input after successful upload
      toast.success('Profile updated successfully!', { id: loadingToastId });
    } catch (error: any) {
      toast.error(`Failed to update profile: ${error.message}`, { id: loadingToastId });
      console.error('Profile update error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <div className="text-center text-muted-foreground">Loading profile...</div>;
  }

  if (!user) {
    return <div className="text-center text-muted-foreground">Please log in to view your profile.</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
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
                disabled={!!avatarFile} // Disable if a file is selected for upload
              />
            </div>
            <Button onClick={handleUpdateProfile} disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Update Profile'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;