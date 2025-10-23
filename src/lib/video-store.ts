import { v4 as uuidv4 } from 'uuid';

export interface Video {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  uploadDate: string;
}

const LOCAL_STORAGE_KEY = 'meetupe_videos';

// Function to get all videos from local storage
export const getVideos = (): Video[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  const videosJson = localStorage.getItem(LOCAL_STORAGE_KEY);
  return videosJson ? JSON.parse(videosJson) : [];
};

// Function to add a new video to local storage
export const addVideo = (newVideo: Omit<Video, 'id' | 'uploadDate'>): Video => {
  const videos = getVideos();
  const videoWithId: Video = {
    id: uuidv4(),
    uploadDate: new Date().toISOString(),
    ...newVideo,
  };
  videos.push(videoWithId);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(videos));
  return videoWithId;
};

// Function to get a single video by ID
export const getVideoById = (id: string): Video | undefined => {
  const videos = getVideos();
  return videos.find(video => video.id === id);
};