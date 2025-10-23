import { v4 as uuidv4 } from 'uuid'; // Still useful for client-side ID generation if needed, but Supabase will handle primary keys
import { supabase } from '@/integrations/supabase/client';

export interface Video {
  id: string;
  user_id: string; // Added user_id to link videos to users
  title: string;
  description: string;
  video_url: string; // Changed from videoUrl to video_url for Supabase convention
  thumbnail_url: string; // Changed from thumbnailUrl to thumbnail_url for Supabase convention
  created_at: string; // Changed from uploadDate to created_at for Supabase convention
}

// Function to get all videos from Supabase
export const getVideos = async (): Promise<Video[]> => {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching videos:', error);
    return [];
  }
  return data as Video[];
};

// Function to add a new video to Supabase (metadata only, files handled separately)
export const addVideoMetadata = async (newVideo: Omit<Video, 'id' | 'created_at' | 'user_id'>, userId: string): Promise<Video | null> => {
  const { data, error } = await supabase
    .from('videos')
    .insert({
      user_id: userId,
      title: newVideo.title,
      description: newVideo.description,
      video_url: newVideo.video_url,
      thumbnail_url: newVideo.thumbnail_url,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding video metadata:', error);
    return null;
  }
  return data as Video;
};

// Function to get a single video by ID from Supabase
export const getVideoById = async (id: string): Promise<Video | undefined> => {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching video by ID:', error);
    return undefined;
  }
  return data as Video;
};