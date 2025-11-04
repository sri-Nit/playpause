import { supabase } from '@/integrations/supabase/client';
import { Like, Video } from './types';

// Function to get likes for a video
export const getLikesForVideo = async (videoId: string): Promise<Like[]> => {
  try {
    const { data, error } = await supabase
      .from('likes')
      .select('*')
      .eq('video_id', videoId);

    if (error) {
      console.error('Error fetching likes:', error);
      throw new Error(error.message);
    }
    return data as Like[];
  } catch (error) {
    console.error('Unexpected error fetching likes:', error);
    throw error;
  }
};

// Function to add a like
export const addLike = async (userId: string, videoId: string): Promise<Like | null> => {
  try {
    const { data, error } = await supabase
      .from('likes')
      .insert({ user_id: userId, video_id: videoId })
      .select()
      .single();

    if (error) {
      console.error('Error adding like:', error);
      throw new Error(error.message);
    }
    return data as Like;
  } catch (error) {
    console.error('Unexpected error adding like:', error);
    throw error;
  }
};

// Function to remove a like
export const removeLike = async (userId: string, videoId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', userId)
      .eq('video_id', videoId);

    if (error) {
      console.error('Error removing like:', error);
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Unexpected error removing like:', error);
    throw error;
  }
};

// Function to get videos liked by a specific user
export const getLikedVideosByUser = async (userId: string): Promise<Video[]> => {
  try {
    const { data, error } = await supabase
      .from('likes')
      .select('video_id, videos(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching liked videos:', error);
      throw new Error(error.message);
    }
    return data.map(item => item.videos).filter(Boolean) as Video[];
  } catch (error) {
    console.error('Unexpected error fetching liked videos:', error);
    throw error;
  }
};