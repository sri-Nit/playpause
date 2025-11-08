import { Profile as SupabaseProfile } from '@supabase/supabase-js';

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
  status: 'draft' | 'published';
  duration: number | null;
  profiles?: Profile; // Added to include creator's profile directly with the video
}

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  message_preference: 'open' | 'requests' | 'blocked';
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
  parent_comment_id: string | null;
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
  videos: Video;
}

export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  created_at: string;
  last_message_at: string;
  user1: Profile;
  user2: Profile;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  created_at: string;
  is_read: boolean;
  sender: Profile;
}