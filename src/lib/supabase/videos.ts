import { supabase } from '@/integrations/supabase/client';
import { Video } from './types';

// Function to get all published videos
export const getVideos = async (): Promise<Video[]> => {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select(`
        id,
        user_id,
        channel_id,
        title,
        description,
        tags,
        visibility,
        status,
        video_url,
        hls_master_path,
        thumbnail_url,
        size_bytes,
        created_at,
        updated_at,
        creator_profiles:profiles!videos_owner_id_fkey(first_name, last_name, avatar_url),
        video_stats!id(views)
      `) // Using the explicit foreign key constraint name and adding video_stats
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching videos:', error);
      throw new Error(error.message);
    }
    return data as Video[];
  } catch (error) {
    console.error('Unexpected error fetching videos:', error);
    throw error;
  }
};

// Function to get all videos for a specific creator (including drafts and processing)
export const getCreatorVideos = async (userId: string): Promise<Video[]> => {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select(`
        id,
        user_id,
        channel_id,
        title,
        description,
        tags,
        visibility,
        status,
        video_url,
        hls_master_path,
        thumbnail_url,
        size_bytes,
        created_at,
        updated_at,
        creator_profiles:profiles!videos_owner_id_fkey(first_name, last_name, avatar_url),
        video_stats!id(views)
      `) // Using the explicit foreign key constraint name
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching creator videos:', error);
      throw new Error(error.message);
    }
    return data as Video[];
  } catch (error) {
    console.error('Unexpected error fetching creator videos:', error);
    throw error;
  }
};

// Function to add a new video to Supabase (metadata only, files handled separately)
export const addVideoMetadata = async (
  newVideo: Omit<Video, 'id' | 'created_at' | 'user_id' | 'updated_at' | 'status' | 'creator_profiles' | 'video_stats' | 'channel'>, // Adjusted Omit type
  userId: string,
  initialStatus: 'draft' | 'published' | 'processing' = 'processing' // Default to 'processing'
): Promise<Video | null> => {
  try {
    const { data, error } = await supabase
      .from('videos')
      .insert({
        user_id: userId,
        title: newVideo.title,
        description: newVideo.description,
        video_url: newVideo.video_url,
        thumbnail_url: newVideo.thumbnail_url,
        tags: newVideo.tags,
        status: initialStatus, // Use the provided initialStatus
        // duration_seconds is no longer inserted
      })
      .select(`
        id,
        user_id,
        channel_id,
        title,
        description,
        tags,
        visibility,
        status,
        video_url,
        hls_master_path,
        thumbnail_url,
        size_bytes,
        created_at,
        updated_at,
        creator_profiles:profiles!videos_owner_id_fkey(first_name, last_name, avatar_url)
      `) // Using the explicit foreign key constraint name
      .single();

    if (error) {
      console.error('Error adding video metadata:', error);
      throw new Error(error.message);
    }
    return data as Video;
  } catch (error) {
    console.error('Unexpected error adding video metadata:', error);
    throw error;
  }
};

// Function to get a single video by ID from Supabase
export const getVideoById = async (id: string): Promise<Video | undefined> => {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select(`
        id,
        user_id,
        channel_id,
        title,
        description,
        tags,
        visibility,
        status,
        video_url,
        hls_master_path,
        thumbnail_url,
        size_bytes,
        created_at,
        updated_at,
        creator_profiles:profiles!videos_owner_id_fkey(first_name, last_name, avatar_url),
        video_stats!id(views)
      `) // Using the explicit foreign key constraint name
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching video by ID:', error);
      throw new Error(error.message);
    }
    return data as Video;
  } catch (error) {
    console.error('Unexpected error fetching video by ID:', error);
    throw error;
  }
};

// Function to update video metadata
export const updateVideoMetadata = async (videoId: string, updatedFields: Partial<Omit<Video, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'status' | 'creator_profiles' | 'video_stats' | 'channel'>>): Promise<Video | null> => {
  try {
    const { data, error } = await supabase
      .from('videos')
      .update(updatedFields)
      .eq('id', videoId)
      .select(`
        id,
        user_id,
        channel_id,
        title,
        description,
        tags,
        visibility,
        status,
        video_url,
        hls_master_path,
        thumbnail_url,
        size_bytes,
        created_at,
        updated_at,
        creator_profiles:profiles!videos_owner_id_fkey(first_name, last_name, avatar_url)
      `) // Using the explicit foreign key constraint name
      .single();

    if (error) {
      console.error('Error updating video metadata:', error);
      throw new Error(error.message);
    }
    return data as Video;
  } catch (error) {
    console.error('Unexpected error updating video metadata:', error);
    throw error;
  }
};

// Function to update video status
export const updateVideoStatus = async (videoId: string, status: 'draft' | 'published' | 'processing' | 'blocked'): Promise<Video | null> => {
  try {
    const { data, error } = await supabase
      .from('videos')
      .update({ status: status })
      .eq('id', videoId)
      .select(`
        id,
        user_id,
        channel_id,
        title,
        description,
        tags,
        visibility,
        status,
        video_url,
        hls_master_path,
        thumbnail_url,
        size_bytes,
        created_at,
        updated_at,
        creator_profiles:profiles!videos_owner_id_fkey(first_name, last_name, avatar_url)
      `) // Using the explicit foreign key constraint name
      .single();

    if (error) {
      console.error('Error updating video status:', error);
      throw new Error(error.message);
    }
    return data as Video;
  } catch (error) {
    console.error('Unexpected error updating video status:', error);
    throw error;
  }
};

// Function to delete a video
export const deleteVideo = async (videoId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', videoId);

    if (error) {
      console.error('Error deleting video:', error);
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Unexpected error deleting video:', error);
    throw error;
  }
};

// Function to search videos by title, description, or tags
export const searchVideos = async (query: string): Promise<Video[]> => {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select(`
        id,
        user_id,
        channel_id,
        title,
        description,
        tags,
        visibility,
        status,
        video_url,
        hls_master_path,
        thumbnail_url,
        size_bytes,
        created_at,
        updated_at,
        creator_profiles:profiles!videos_owner_id_fkey(first_name, last_name, avatar_url)
      `) // Using the explicit foreign key constraint name
      .eq('status', 'published')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching videos:', error);
      throw new Error(error.message);
    }
    return data as Video[];
  } catch (error) {
    console.error('Unexpected error searching videos:', error);
    throw error;
  }
};