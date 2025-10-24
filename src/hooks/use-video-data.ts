import { useQuery } from '@tanstack/react-query';
import {
  getVideos,
  getCreatorVideos,
  getVideoById,
  getProfileById,
  getLikesForVideo,
  getCommentsForVideo,
  getVideoAnalytics,
  getCommentsForCreatorVideos,
  searchVideos,
} from '@/lib/video-store';

// Hook to fetch all published videos
export const useVideos = () => {
  return useQuery({
    queryKey: ['videos'],
    queryFn: getVideos,
  });
};

// Hook to fetch all videos for a specific creator (including drafts)
export const useCreatorVideos = (userId: string) => {
  return useQuery({
    queryKey: ['creatorVideos', userId],
    queryFn: () => getCreatorVideos(userId),
    enabled: !!userId, // Only run if userId is available
  });
};

// Hook to fetch a single video by ID
export const useVideoById = (videoId: string) => {
  return useQuery({
    queryKey: ['video', videoId],
    queryFn: () => getVideoById(videoId),
    enabled: !!videoId, // Only run if videoId is available
  });
};

// Hook to fetch a user profile by ID
export const useProfileById = (profileId: string) => {
  return useQuery({
    queryKey: ['profile', profileId],
    queryFn: () => getProfileById(profileId),
    enabled: !!profileId, // Only run if profileId is available
  });
};

// Hook to fetch likes for a specific video
export const useLikesForVideo = (videoId: string) => {
  return useQuery({
    queryKey: ['videoLikes', videoId],
    queryFn: () => getLikesForVideo(videoId),
    enabled: !!videoId, // Only run if videoId is available
  });
};

// Hook to fetch comments for a specific video
export const useCommentsForVideo = (videoId: string) => {
  return useQuery({
    queryKey: ['videoComments', videoId],
    queryFn: () => getCommentsForVideo(videoId),
    enabled: !!videoId, // Only run if videoId is available
  });
};

// Hook to fetch analytics (likes and comments count) for a specific video
export const useVideoAnalytics = (videoId: string) => {
  return useQuery({
    queryKey: ['videoAnalytics', videoId],
    queryFn: () => getVideoAnalytics(videoId),
    enabled: !!videoId, // Only run if videoId is available
  });
};

// Hook to fetch all comments for a creator's videos
export const useCommentsForCreatorVideos = (userId: string) => {
  return useQuery({
    queryKey: ['creatorComments', userId],
    queryFn: () => getCommentsForCreatorVideos(userId),
    enabled: !!userId, // Only run if userId is available
  });
};

// Hook to search videos
export const useSearchVideos = (query: string) => {
  return useQuery({
    queryKey: ['searchResults', query],
    queryFn: () => searchVideos(query),
    enabled: !!query, // Only run if query is not empty
  });
};