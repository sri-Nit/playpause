import { supabase } from '@/integrations/supabase/client';

export interface Video {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string;
  created_at: string;
  views: number;
  tags: string[] | null;
  status: 'draft' | 'published'; // Added status column
}

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

export interface Like {
  id: string;
  user_id: string;
  video_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  video_id: string;
  user_id: string;
  text: string;
  created_at: string;
  profiles: Profile;
  parent_comment_id: string | null; // Added parent_comment_id
}

export interface Subscription {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  video_id: string;
  reason: string;
  created_at: string;
  resolved: boolean;
}

export interface WatchHistory {
  id: string;
  user_id: string;
  video_id: string;
  watched_at: string;
  videos: Video; // To fetch video details along with history entry
}

// Function to get all videos from Supabase
export const getVideos = async (): Promise<Video[]> => {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('status', 'published') // Only fetch published videos for general browsing
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

// Function to get all videos for a specific creator (including drafts)
export const getCreatorVideos = async (userId: string): Promise<Video[]> => {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
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
export const addVideoMetadata = async (newVideo: Omit<Video, 'id' | 'created_at' | 'user_id' | 'views' | 'status'>, userId: string, status: 'draft' | 'published' = 'published'): Promise<Video | null> => {
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
        status: status, // Include status
      })
      .select()
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
      .select('*')
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

// Function to get a user profile by ID
export const getProfileById = async (id: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error fetching profile:', error);
      throw new Error(error.message);
    }
    return data as Profile | null;
  } catch (error) {
    console.error('Unexpected error fetching profile:', error);
    throw error;
  }
};

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

// Function to get comments for a video
export const getCommentsForVideo = async (videoId: string): Promise<Comment[]> => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles(first_name, last_name, avatar_url)')
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
      .select('*, profiles(first_name, last_name, avatar_url)')
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

// Function to update video metadata
export const updateVideoMetadata = async (videoId: string, updatedFields: Partial<Omit<Video, 'id' | 'user_id' | 'created_at' | 'views'>>): Promise<Video | null> => {
  try {
    const { data, error } = await supabase
      .from('videos')
      .update(updatedFields)
      .eq('id', videoId)
      .select()
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
export const updateVideoStatus = async (videoId: string, status: 'draft' | 'published'): Promise<Video | null> => {
  try {
    const { data, error } = await supabase
      .from('videos')
      .update({ status: status })
      .eq('id', videoId)
      .select()
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

// --- Subscription Functions ---

// Function to check if a user is following another user
export const isFollowing = async (followerId: string, followingId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error('Error checking subscription status:', error);
      throw new Error(error.message);
    }
    return !!data;
  } catch (error) {
    console.error('Unexpected error checking subscription status:', error);
    throw error;
  }
};

// Function to add a subscription
export const addSubscription = async (followerId: string, followingId: string): Promise<Subscription | null> => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert({ follower_id: followerId, following_id: followingId })
      .select()
      .single();

    if (error) {
      console.error('Error adding subscription:', error);
      throw new Error(error.message);
    }
    return data as Subscription;
  } catch (error) {
    console.error('Unexpected error adding subscription:', error);
    throw error;
  }
};

// Function to remove a subscription
export const removeSubscription = async (followerId: string, followingId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) {
      console.error('Error removing subscription:', error);
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Unexpected error removing subscription:', error);
    throw error;
  }
};

// Function to get users a specific user is following
export const getFollowing = async (followerId: string): Promise<Subscription[]> => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('follower_id', followerId);

    if (error) {
      console.error('Error fetching following list:', error);
      throw new Error(error.message);
    }
    return data as Subscription[];
  } catch (error) {
    console.error('Unexpected error fetching following list:', error);
    throw error;
  }
};

// Function to get users who are following a specific user
export const getFollowers = async (followingId: string): Promise<Subscription[]> => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('following_id', followingId);

    if (error) {
      console.error('Error fetching followers list:', error);
      throw new Error(error.message);
    }
    return data as Subscription[];
  } catch (error) {
    console.error('Unexpected error fetching followers list:', error);
    throw error;
  }
};

// Function to search videos by title, description, or tags
export const searchVideos = async (query: string): Promise<Video[]> => {
  try {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('status', 'published') // Only search published videos
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

// --- Admin & Analytics Functions ---

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

// Function to get total reports
export const getTotalReports = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error fetching total reports:', error);
      throw new Error(error.message);
    }
    return count || 0;
  } catch (error) {
    console.error('Unexpected error fetching total reports:', error);
    throw error;
  }
};

// Function to get all reports
export const getAllReports = async (): Promise<Report[]> => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all reports:', error);
      throw new Error(error.message);
    }
    return data as Report[];
  } catch (error) {
    console.error('Unexpected error fetching all reports:', error);
    throw error;
  }
};

// Function to resolve a report
export const resolveReport = async (reportId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('reports')
      .update({ resolved: true })
      .eq('id', reportId);

    if (error) {
      console.error('Error resolving report:', error);
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Unexpected error resolving report:', error);
    throw error;
  }
};

// Function to delete a report
export const deleteReport = async (reportId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportId);

    if (error) {
      console.error('Error deleting report:', error);
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Unexpected error deleting report:', error);
    throw error;
  }
};

// Function to add a report
export const addReport = async (reporterId: string, videoId: string, reason: string): Promise<Report | null> => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .insert({ reporter_id: reporterId, video_id: videoId, reason })
      .select()
      .single();

    if (error) {
      console.error('Error adding report:', error);
      throw new Error(error.message);
    }
    return data as Report;
  } catch (error) {
    console.error('Unexpected error adding report:', error);
    throw error;
  }
};

// Function to get analytics for a specific video (likes and comments count)
// This function is now optimized to fetch counts in bulk if given multiple video IDs
export const getVideoAnalytics = async (videoIds: string[]): Promise<Record<string, { likes: number; comments: number }>> => {
  if (videoIds.length === 0) {
    return {};
  }

  try {
    const { data: likesData, error: likesError } = await supabase
      .from('likes')
      .select('video_id', { count: 'exact' })
      .in('video_id', videoIds);

    if (likesError) throw new Error(likesError.message);

    const { data: commentsData, error: commentsError } = await supabase
      .from('comments')
      .select('video_id', { count: 'exact' })
      .in('video_id', videoIds);

    if (commentsError) throw new Error(commentsError.message);

    const analyticsMap: Record<string, { likes: number; comments: number }> = {};
    videoIds.forEach(id => {
      analyticsMap[id] = { likes: 0, comments: 0 };
    });

    likesData.forEach((item: any) => {
      if (analyticsMap[item.video_id]) {
        analyticsMap[item.video_id].likes++;
      }
    });

    commentsData.forEach((item: any) => {
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


// Function to get all comments for a creator's videos
export const getCommentsForCreatorVideos = async (userId: string): Promise<Comment[]> => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles(first_name, last_name, avatar_url), videos(title)')
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

// --- Watch History Functions ---

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

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 means no rows found
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
      .select('*, videos(*)') // Select all from watch_history and join video details
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