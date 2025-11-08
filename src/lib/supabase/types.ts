import { Profile as SupabaseProfile } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  updated_at: string | null;
}

export interface Channel {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
}

export interface Video {
  id: string;
  user_id: string; // Corrected from owner_id to user_id
  channel_id: string | null;
  title: string;
  description: string | null;
  tags: string[] | null;
  visibility: 'public' | 'unlisted' | 'private';
  status: 'processing' | 'ready' | 'failed' | 'blocked' | 'draft';
  video_url: string | null; // Corrected from raw_path
  hls_master_path: string | null;
  thumbnail_url: string | null; // Corrected from thumbnail_path
  // duration_seconds: number | null; // Removed
  size_bytes: number | null;
  created_at: string;
  updated_at: string;
  creator_profiles?: Pick<Profile, 'first_name' | 'last_name' | 'avatar_url'>; // Embedded profile with alias
  video_stats?: { views: number }[]; // Embedded video stats for views
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
  parent_comment_id: string | null; // Added parent_comment_id
  creator_profiles?: Pick<Profile, 'first_name' | 'last_name' | 'avatar_url'>; // Embedded profile with alias
}

// Moved from WatchVideo.tsx and made creator_profiles more precise
export interface CommentWithProfile extends Comment {
  creator_profiles: Pick<Profile, 'first_name' | 'last_name' | 'avatar_url'>;
  replies?: CommentWithProfile[]; // For nested replies
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
  videos: Video; // Changed from video? to videos to match the select query
}