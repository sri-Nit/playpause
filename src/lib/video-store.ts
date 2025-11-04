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
  duration: number | null; // Added duration column (in seconds)
}

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  message_preference: 'open' | 'requests' | 'blocked'; // Added message_preference
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

// --- Messaging Interfaces ---
export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  created_at: string;
  last_message_at: string;
  user1: Profile; // Joined profile data for user1
  user2: Profile; // Joined profile data for user2
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  created_at: string;
  is_read: boolean;
  sender: Profile; // Joined profile data for sender
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
        duration: newVideo.duration, // Include duration
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
      .select('id, first_name, last_name, avatar_url, message_preference') // Include message_preference
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

// New function to get videos liked by a specific user
export const getLikedVideosByUser = async (userId: string): Promise<Video[]> => {
  try {
    const { data, error } = await supabase
      .from('likes')
      .select('video_id, videos(*)') // Select video_id and all columns from the videos table
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching liked videos:', error);
      throw new Error(error.message);
    }
    // Extract the video objects from the nested structure
    return data.map(item => item.videos).filter(Boolean) as Video[];
  } catch (error) {
    console.error('Unexpected error fetching liked videos:', error);
    throw error;
  }
};

// New function to get videos from channels a user is subscribed to
export const getSubscribedChannelVideos = async (userId: string): Promise<Video[]> => {
  try {
    // First, get the list of creators the user is following
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('following_id')
      .eq('follower_id', userId);

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      throw new Error(subError.message);
    }

    const followingIds = subscriptions.map(sub => sub.following_id);

    if (followingIds.length === 0) {
      return []; // No subscriptions, so no videos to fetch
    }

    // Then, get published videos from those creators
    const { data: videos, error: videoError } = await supabase
      .from('videos')
      .select('*')
      .in('user_id', followingIds)
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (videoError) {
      console.error('Error fetching subscribed channel videos:', videoError);
      throw new Error(videoError.message);
    }

    return videos as Video[];
  } catch (error) {
    console.error('Unexpected error fetching subscribed channel videos:', error);
    throw error;
  }
};

// --- New Messaging Functions ---

/**
 * Gets an existing conversation between two users, or creates a new one if it doesn't exist.
 * Handles message requests based on the recipient's message_preference.
 */
export const getOrCreateConversation = async (
  currentUserId: string,
  recipientId: string,
): Promise<Conversation | null> => {
  try {
    // Ensure user1_id is always the smaller UUID for consistent lookup
    const [user1_id, user2_id] = [currentUserId, recipientId].sort();

    // Try to find an existing conversation
    const { data: existingConversation, error: fetchError } = await supabase
      .from('conversations')
      .select('*, user1:fk_user1_profile(id, first_name, last_name, avatar_url), user2:fk_user2_profile(id, first_name, last_name, avatar_url)')
      .eq('user1_id', user1_id)
      .eq('user2_id', user2_id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
      throw new Error(fetchError.message);
    }

    if (existingConversation) {
      return existingConversation as Conversation;
    }

    // If no existing conversation, create a new one
    const { data: recipientProfile, error: profileError } = await getProfileById(recipientId);
    if (profileError || !recipientProfile) {
      throw new Error('Recipient profile not found.');
    }

    let conversationStatus: 'pending' | 'accepted' | 'rejected' | 'blocked' = 'accepted';

    // Determine initial status based on recipient's message_preference
    if (recipientProfile.message_preference === 'blocked') {
      throw new Error('This user does not accept messages.');
    } else if (recipientProfile.message_preference === 'requests') {
      conversationStatus = 'pending';
    }
    // If 'open', status remains 'accepted'

    const { data: newConversation, error: insertError } = await supabase
      .from('conversations')
      .insert({ user1_id, user2_id, status: conversationStatus })
      .select('*, user1:fk_user1_profile(id, first_name, last_name, avatar_url), user2:fk_user2_profile(id, first_name, last_name, avatar_url)')
      .single();

    if (insertError) {
      throw new Error(insertError.message);
    }

    return newConversation as Conversation;
  } catch (error) {
    console.error('Error getting or creating conversation:', error);
    throw error;
  }
};

/**
 * Gets all conversations for a given user, ordered by last message time.
 */
export const getConversationsForUser = async (userId: string): Promise<Conversation[]> => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*, user1:fk_user1_profile(id, first_name, last_name, avatar_url), user2:fk_user2_profile(id, first_name, last_name, avatar_url)')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('last_message_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }
    return data as Conversation[];
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
};

/**
 * Gets all messages within a specific conversation, ordered by creation time.
 */
export const getMessagesInConversation = async (conversationId: string): Promise<Message[]> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:sender_id(id, first_name, last_name, avatar_url)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }
    return data as Message[];
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

/**
 * Sends a new message in a conversation.
 */
export const sendMessage = async (
  conversationId: string,
  senderId: string,
  text: string,
): Promise<Message | null> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: senderId, text })
      .select('*, sender:sender_id(id, first_name, last_name, avatar_url)')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // Update last_message_at for the conversation
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    return data as Message;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Updates the status of a conversation (e.g., 'accepted', 'rejected', 'blocked').
 */
export const updateConversationStatus = async (
  conversationId: string,
  status: 'pending' | 'accepted' | 'rejected' | 'blocked',
): Promise<Conversation | null> => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .update({ status })
      .eq('id', conversationId)
      .select('*, user1:fk_user1_profile(id, first_name, last_name, avatar_url), user2:fk_user2_profile(id, first_name, last_name, avatar_url)')
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return data as Conversation;
  } catch (error) {
    console.error('Error updating conversation status:', error);
    throw error;
  }
};

/**
 * Updates a user's message preference.
 */
export const updateProfileMessagePreference = async (
  userId: string,
  preference: 'open' | 'requests' | 'blocked',
): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ message_preference: preference })
      .eq('id', userId)
      .select('id, first_name, last_name, avatar_url, message_preference')
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return data as Profile;
  } catch (error) {
    console.error('Error updating message preference:', error);
    throw error;
  }
};