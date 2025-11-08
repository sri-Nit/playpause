import { Profile as SupabaseProfile } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  created_at: string;
}

export interface Channel {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
}

export interface Video {
  id: string;
  owner_id: string; // Changed from user_id to owner_id
  channel_id: string | null;
  title: string;
  description: string | null;
  tags: string[] | null;
  visibility: 'public' | 'unlisted' | 'private';
  status: 'processing' | 'ready' | 'failed' | 'blocked' | 'draft'; // Updated status values
  raw_path: string | null;
  hls_master_path: string | null;
  thumbnail_path: string | null;
  duration_seconds: number | null;
  size_bytes: number | null;
  created_at: string;
  updated_at: string;
  profiles?: Profile; // Joined profile data
}

export interface VideoStats {
  video_id: string;
  views: number;
  likes: number;
  comments_count: number;
  last_viewed_at: string | null;
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
  parent_comment_id: string | null; // Added parent_comment_id back
  profiles?: Profile; // Joined profile data
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
  watch_seconds: number | null; // Added watch_seconds
  videos?: Video; // Joined video data
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  created_at: string;
  last_message_at: string;
  user1?: Profile; // Joined profile data for user1
  user2?: Profile; // Joined profile data for user2
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  created_at: string;
  is_read: boolean;
  sender?: Profile; // Joined profile data for sender
}