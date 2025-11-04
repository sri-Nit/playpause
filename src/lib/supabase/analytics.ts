import { supabase } from '@/integrations/supabase/client';

// Function to increment video views
export const incrementVideoView = async (videoId: string) => {
  try {
    const { data, error } = await supabase.rpc('increment_video_view', { video_id_param: videoId });
    if (error) {
      console.error('Error incrementing view count:', error);
      throw new Error(error.message);
    }
    return data;
  } catch (error) {
    console.error('Unexpected error incrementing view count:', error);
    throw error;
  }
};

// Function to get total users
export const getTotalUsers = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error fetching total users:', error);
      throw new Error(error.message);
    }
    return count || 0;
  } catch (error) {
    console.error('Unexpected error fetching total users:', error);
    throw error;
  }
};

// Function to get total videos
export const getTotalVideos = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error fetching total videos:', error);
      throw new Error(error.message);
    }
    return count || 0;
  } catch (error) {
    console.error('Unexpected error fetching total videos:', error);
    throw error;
  }
};

// Function to get analytics for a specific video (likes and comments count)
export const getVideoAnalytics = async (videoIds: string[]): Promise<Record<string, { likes: number; comments: number }>> => {
  if (videoIds.length === 0) {
    return {};
  }

  try {
    // Fetch all likes for the given video IDs
    const { data: likesData, error: likesError } = await supabase
      .from('likes')
      .select('video_id')
      .in('video_id', videoIds);

    if (likesError) throw new Error(likesError.message);

    // Fetch all comments for the given video IDs
    const { data: commentsData, error: commentsError } = await supabase
      .from('comments')
      .select('video_id')
      .in('video_id', videoIds);

    if (commentsError) throw new Error(commentsError.message);

    const analyticsMap: Record<string, { likes: number; comments: number }> = {};
    videoIds.forEach(id => {
      analyticsMap[id] = { likes: 0, comments: 0 };
    });

    // Aggregate likes
    likesData.forEach((item: { video_id: string }) => {
      if (analyticsMap[item.video_id]) {
        analyticsMap[item.video_id].likes++;
      }
    });

    // Aggregate comments
    commentsData.forEach((item: { video_id: string }) => {
      if (analyticsMap[item.video_id]) {
        analyticsMap[item.video_id].comments++;
      }
    });

    return analyticsMap;
  } catch (error) {
    console.error('Error fetching video analytics:', error);
    throw error;
  }
};