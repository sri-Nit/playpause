import { supabase } from '@/integrations/supabase/client';
import { WatchHistory } from './types';

// Function to add a video to a user's watch history
export const addVideoToHistory = async (userId: string, videoId: string): Promise<void> => {
  try {
    // Check if the video is already in history to avoid duplicates
    const { data: existingHistory, error: selectError } = await supabase
      .from('watch_history')
      .select('id')
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      throw new Error(selectError.message);
    }

    if (existingHistory) {
      // If exists, update the watched_at timestamp to bring it to the top of history
      const { error: updateError } = await supabase
        .from('watch_history')
        .update({ watched_at: new Date().toISOString() })
        .eq('id', existingHistory.id);

      if (updateError) {
        throw new Error(updateError.message);
      }
    } else {
      // If not exists, insert new entry
      const { error: insertError } = await supabase
        .from('watch_history')
        .insert({ user_id: userId, video_id: videoId });

      if (insertError) {
        throw new Error(insertError.message);
      }
    }
  } catch (error) {
    console.error('Error adding video to history:', error);
    throw error;
  }
};

// Function to get a user's watch history
export const getWatchHistory = async (userId: string): Promise<WatchHistory[]> => {
  try {
    const { data, error } = await supabase
      .from('watch_history')
      .select('*, videos(*)')
      .eq('user_id', userId)
      .order('watched_at', { ascending: false });

    if (error) {
      console.error('Error fetching watch history:', error);
      throw new Error(error.message);
    }
    return data as WatchHistory[];
  } catch (error) {
    console.error('Unexpected error fetching watch history:', error);
    throw error;
  }
};