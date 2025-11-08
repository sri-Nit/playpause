import { supabase } from '@/integrations/supabase/client';
import { Video } from './types';

// Function to get all published videos
export const getVideos = async (): Promise<Video[]> => {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*, profiles(username, display_name)') // Updated to select new profile fields
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
export const getCreatorVideos = async (ownerId: string): Promise<Video[]> => { // Changed userId to ownerId
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*, profiles(username, display_name)') // Updated to select new profile fields
      .eq('owner_id', ownerId) // Changed user_id to owner_id
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
  newVideo: Omit<Video, 'id' | 'created_at' | 'owner_id' | 'views' | 'status' | 'profiles' | 'visibility' | 'raw_path' | 'hls_master_path' | 'thumbnail_path' | 'duration_seconds' | 'size_bytes' | 'updated_at'> & {
    video_url: string; // Add video_url for upload
    thumbnail_url: string; // Add thumbnail_url for upload
    duration: number | null; // Add duration for upload
  },
  ownerId: string, // Changed userId to ownerId
  initialStatus: 'draft' | 'published' | 'processing' = 'processing' // Default to 'processing'
): Promise<Video | null> => {
  try {
    const { data, error } = await supabase
      .from('videos')
      .insert({
        owner_id: ownerId, // Changed user_id to owner_id
        title: newVideo.title,
        description: newVideo.description,
        raw_path: newVideo.video_url, // Map video_url to raw_path
        thumbnail_path: newVideo.thumbnail_url, // Map thumbnail_url to thumbnail_path
        tags: newVideo.tags,
        status: initialStatus, // Use the provided initialStatus
        duration_seconds: newVideo.duration, // Map duration to duration_seconds
        visibility: 'public', // Default visibility to public for new uploads
      })
      .select('*, profiles(username, display_name)') // Updated to select new profile fields
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
      .select('*, profiles(username, display_name)') // Updated to select new profile fields
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
export const updateVideoMetadata = async (videoId: string, updatedFields: Partial<Omit<Video, 'id' | 'owner_id' | 'created_at' | 'profiles' | 'views'>>): Promise<Video | null> => { // Removed views
  try {
    const { data, error } = await supabase
      .from('videos')
      .update(updatedFields)
      .eq('id', videoId)
      .select('*, profiles(username, display_name)') // Updated to select new profile fields
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
export const updateVideoStatus = async (videoId: string, status: 'draft' | 'published' | 'processing' | 'blocked' | 'ready' | 'failed'): Promise<Video | null> => { // Added ready, failed
  try {
    const { data, error } = await supabase
      .from('videos')
      .update({ status: status })
      .eq('id', videoId)
      .select('*, profiles(username, display_name)') // Updated to select new profile fields
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
      .select('*, profiles(username, display_name)') // Updated to select new profile fields
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