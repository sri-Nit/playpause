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
  tags: string[] | null; // Added tags column
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
}

export interface Subscription {
  id: string;
  follower_id: string;
  following_id: string;
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
      throw new Error(error.message);
    }
    
    return data as Video[];
  } catch (error) {
    console.error('Unexpected error fetching videos:', error);
    throw error;
  }
};

// Function to add a new video to Supabase (metadata only, files handled separately)
export const addVideoMetadata = async (newVideo: Omit<Video, 'id' | 'created_at' | 'user_id' | 'views'>, userId: string): Promise<Video | null> => {
  try {
    const { data, error } = await supabase
      .from('videos')
      .insert({
        user_id: userId,
        title: newVideo.title,
        description: newVideo.description,
        video_url: newVideo.video_url,
        thumbnail_url: newVideo.thumbnail_url,
        tags: newVideo.tags, // Include tags
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

    if (error && error.code !== 'PGRST116') {
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
export const addComment = async (videoId: string, userId: string, text: string): Promise<Comment | null> => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert({ video_id: videoId, user_id: userId, text })
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