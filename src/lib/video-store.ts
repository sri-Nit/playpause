import { supabase } from '@/integrations/supabase/client';

export interface Video {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string;
  created_at: string;
}

// Function to get all videos from Supabase
export const getVideos = async (): Promise<Video[]> => {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching videos:', error);
      throw new Error(error.message); // Throw error for better reporting
    }
    
    return data as Video[];
  } catch (error) {
    console.error('Unexpected error fetching videos:', error);
    throw error; // Re-throw unexpected errors
  }
};

// Function to add a new video to Supabase (metadata only, files handled separately)
export const addVideoMetadata = async (newVideo: Omit<Video, 'id' | 'created_at' | 'user_id'>, userId: string): Promise<Video | null> => {
  try {
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
      throw new Error(error.message); // Throw error for better reporting
    }
    
    return data as Video;
  } catch (error) {
    console.error('Unexpected error adding video metadata:', error);
    throw error; // Re-throw unexpected errors
  }
};

// Function to get a single video by ID from Supabase
export const getVideoById = async (id: string): Promise<Video | undefined> => {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching video by ID:', error);
      throw new Error(error.message); // Throw error for better reporting
    }
    
    return data as Video;
  } catch (error) {
    console.error('Unexpected error fetching video by ID:', error);
    throw error; // Re-throw unexpected errors
  }
};