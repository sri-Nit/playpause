import { supabase } from '@/integrations/supabase/client';
import { Subscription, Video } from './types';

// Function to check if a user is following another user
export const isFollowing = async (followerId: string, followingId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();

    if (error && error.code !== 'PGRST116') {
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
      .select('*, profiles!subscriptions_following_id_fkey(username, display_name)') // Updated to select new profile fields
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
      .select('*, profiles!subscriptions_follower_id_fkey(username, display_name)') // Updated to select new profile fields
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

// New function to get videos from channels a user is subscribed to
export const getSubscribedChannelVideos = async (userId: string): Promise<Video[]> => {
  try {
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
      return [];
    }

    const { data: videos, error: videoError } = await supabase
      .from('videos')
      .select('*, profiles(username, display_name)') // Updated to select new profile fields
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