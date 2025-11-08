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
  owner_id: string;
  channel_id: string | null;
  title: string;
  description: string | null;
  tags: string[] | null;
  visibility: 'public' | 'unlisted' | 'private';
  status: 'processing' | 'ready' | 'failed' | 'blocked' | 'draft';
  raw_path: string | null;
  hls_master_path: string | null;
  thumbnail_path: string | null;
  duration_seconds: number | null;
  size_bytes: number | null;
  created_at: string;
  updated_at: string;
  owner_profile?: Profile; // Added to include owner's profile directly with the video
  channel?: Channel; // Added to include channel data
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
  user_profile?: Profile; // Updated to reflect new Profile structure
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
  video?: Video; // Updated to be optional and named 'video'
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  created_at: string;
  last_message_at: string;
  user1_profile?: Profile; // Updated to reflect new Profile structure
  user2_profile?: Profile; // Updated to reflect new Profile structure
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  created_at: string;
  is_read: boolean;
  sender_profile?: Profile; // Updated to reflect new Profile structure
}