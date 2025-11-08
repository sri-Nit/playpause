import { supabase } from '@/integrations/supabase/client';
import { Comment } from './types';

// Function to get comments for a video
export const getCommentsForVideo = async (videoId: string): Promise<Comment[]> => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        video_id,
        user_id,
        text,
        created_at,
        parent_comment_id,
        creator_profiles:profiles!user_id(first_name, last_name, avatar_url)
      `) // Explicitly list comment columns and use alias for profiles
      .eq('video_id', videoId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      throw new Error(error.message);
    }
    return data as Comment[];
  } catch (error) {
    console.error('Unexpected error fetching comments:', error);
    throw error;
  }
};

// Function to add a comment
export const addComment = async (videoId: string, userId: string, text: string, parentCommentId: string | null = null): Promise<Comment | null> => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert({ video_id: videoId, user_id: userId, text, parent_comment_id: parentCommentId })
      .select(`
        id,
        video_id,
        user_id,
        text,
        created_at,
        parent_comment_id,
        creator_profiles:profiles!user_id(first_name, last_name, avatar_url)
      `) // Explicitly list comment columns and use alias for profiles
      .single();

    if (error) {
      console.error('Error adding comment:', error);
      throw new Error(error.message);
    }
    return data as Comment;
  } catch (error) {
    console.error('Unexpected error adding comment:', error);
    throw error;
  }
};

// Function to delete a comment
export const deleteComment = async (commentId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Error deleting comment:', error);
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Unexpected error deleting comment:', error);
    throw error;
  }
};

// Function to get all comments for a creator's videos
export const getCommentsForCreatorVideos = async (userId: string): Promise<Comment[]> => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(`
        id,
        video_id,
        user_id,
        text,
        created_at,
        parent_comment_id,
        creator_profiles:profiles!user_id(first_name, last_name, avatar_url),
        videos(title)
      `) // Explicitly list comment columns and use alias for profiles
      .in('video_id', supabase.from('videos').select('id').eq('user_id', userId))
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments for creator videos:', error);
      throw new Error(error.message);
    }
    return data as Comment[];
  } catch (error) {
    console.error('Unexpected error fetching comments for creator videos:', error);
    throw error;
  }
};