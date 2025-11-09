import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getVideoById,
  getProfileById,
  incrementVideoView,
  Video,
  Profile,
  getLikesForVideo,
  addLike,
  removeLike,
  getCommentsForVideo,
  addComment,
  deleteComment,
  deleteVideo,
  isFollowing,
  addSubscription,
  removeSubscription,
  updateVideoMetadata,
} from '@/lib/video-store';
import VideoPlayer from '@/components/VideoPlayer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Heart,
  MessageCircle,
  Trash2,
  Edit,
  User as LucideUser,
  Plus,
  Check,
  Flag,
  Share2,
} from 'lucide-react';
import { useSession } from '@/components/SessionContextProvider';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

/**
 * NOTE about types:
 * The original code referenced a Comment type that wasn't imported here.
 * To avoid TS errors and keep this file self-contained, define the minimal shape
 * we need for comments as CommentWithProfile below.
 */
interface CommentWithProfile {
  id: string;
  user_id: string;
  parent_comment_id?: string | null;
  text: string;
  created_at: string;
  profiles?: Profile;
  replies?: CommentWithProfile[];
}

const WatchVideo: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading: isSessionLoading } = useSession();

  const [video, setVideo] = useState<Video | null>(null);
  const [uploaderProfile, setUploaderProfile] = useState<Profile | null>(null);
  const [likes, setLikes] = useState<number>(0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTags, setEditTags] = useState('');
  const [isFollowingUploader, setIsFollowingUploader] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Robust handler: increments view once per session (sessionStorage), tries incrementVideoView,
  // falls back to navigator.sendBeacon if available, and updates UI optimistically on success.
  const handleVideoProgressThresholdMet = useCallback(
    async (videoId: string) => {
      const viewKey = `video_viewed_50_${videoId}`;

      // Skip if already recorded this session
      if (sessionStorage.getItem(viewKey)) {
        console.debug(`[WatchVideo] view already recorded for ${videoId} in this session`);
        return;
      }

      // Helper: beacon fallback (adjust endpoint as needed)
      const beaconIncrement = (id: string) => {
        try {
          if (!('sendBeacon' in navigator)) return false;
          const url = '/api/videos/increment-view'; // Change if your backend uses a different route
          const payload = JSON.stringify({ videoId: id });
          const blob = new Blob([payload], { type: 'application/json' });
          return navigator.sendBeacon(url, blob);
        } catch (e) {
          console.warn('[WatchVideo] sendBeacon failed', e);
          return false;
        }
      };

      let incremented = false;

      // Only increment published videos
      if (video?.status === 'published') {
        try {
          await incrementVideoView(videoId);
          incremented = true;
          console.debug('[WatchVideo] incrementVideoView succeeded', videoId);
        } catch (err) {
          console.warn('[WatchVideo] incrementVideoView failed, trying beacon fallback', err);
          try {
            const ok = beaconIncrement(videoId);
            if (ok) {
              incremented = true;
              console.debug('[WatchVideo] sendBeacon fallback succeeded for', videoId);
            } else {
              console.warn('[WatchVideo] sendBeacon fallback returned false');
            }
          } catch (e) {
            console.warn('[WatchVideo] beacon fallback error', e);
          }
        }
      } else {
        console.debug('[WatchVideo] video not published — skipping increment', video?.status);
      }

      // If server (or beacon) incremented, update UI immediately (optimistic)
      if (incremented) {
        setVideo((prev) => {
          if (!prev) return prev;
          // Support either video.views or video.video_stats[0].views depending on shape
          const updated = { ...prev };
          if (typeof (updated as any).views === 'number') {
            (updated as any).views = ((updated as any).views || 0) + 1;
          } else if (Array.isArray((updated as any).video_stats) && (updated as any).video_stats.length > 0) {
            const stats = [...(updated as any).video_stats];
            stats[0] = { ...(stats[0] || {}), views: ((stats[0]?.views || 0) + 1) };
            (updated as any).video_stats = stats;
          } else {
            // Fallback: set views field
            (updated as any).views = ((updated as any).views || 0) + 1;
          }
          return updated;
        });
      }

      // Best-effort: record to user's history if signed-in
      if (user) {
        try {
          // addVideoToHistory may exist in your store — call if available
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          if (typeof addVideoToHistory === 'function') {
            // @ts-ignore
            await addVideoToHistory(user.id, videoId);
          }
        } catch (e) {
          console.warn('[WatchVideo] addVideoToHistory failed', e);
        }
      }

      // Mark counted for this session so we don't repeat
      try {
        sessionStorage.setItem(viewKey, 'true');
      } catch (e) {
        console.warn('[WatchVideo] sessionStorage.setItem failed', e);
      }
    },
    [user, video?.status]
  );

  const fetchVideoDetails = useCallback(async () => {
    if (!id) {
      setError('Video ID is missing.');
      setIsLoading(false);
      return;
    }

    try {
      const fetchedVideo = await getVideoById(id);
      if (!fetchedVideo) {
        setError('Video not found.');
        return;
      }

      // Access control for drafts
      if (fetchedVideo.status === 'draft' && (!user || user.id !== fetchedVideo.user_id)) {
        setError('This video is a draft and not publicly available.');
        setVideo(null);
        setIsLoading(false);
        return;
      }

      setVideo(fetchedVideo);

      // NOTE: do NOT increment views here on load. We increment when playback threshold is met.
      // If you want a page-load increment, uncomment the following:
      // if (fetchedVideo.status === 'published') await incrementVideoView(id);

      // load uploader profile
      try {
        const fetchedProfile = await getProfileById(fetchedVideo.user_id);
        setUploaderProfile(fetchedProfile);
      } catch (e) {
        console.warn('[WatchVideo] getProfileById failed', e);
      }

      // likes
      try {
        const fetchedLikes = await getLikesForVideo(id);
        setLikes(fetchedLikes.length);
        if (user) setIsLiked(fetchedLikes.some((like) => like.user_id === user.id));
      } catch (e) {
        console.warn('[WatchVideo] getLikesForVideo failed', e);
      }

      // subscription status
      if (user && fetchedVideo.user_id !== user.id) {
        try {
          const followingStatus = await isFollowing(user.id, fetchedVideo.user_id);
          setIsFollowingUploader(followingStatus);
        } catch (e) {
          console.warn('[WatchVideo] isFollowing failed', e);
        }
      }

      // comments -> build tree
      try {
        const fetchedComments = await getCommentsForVideo(id);
        const commentMap = new Map<string, CommentWithProfile>();
        fetchedComments.forEach((c: any) => commentMap.set(c.id, { ...(c as any), replies: [] }));
        const roots: CommentWithProfile[] = [];
        fetchedComments.forEach((c: any) => {
          if (c.parent_comment_id && commentMap.has(c.parent_comment_id)) {
            commentMap.get(c.parent_comment_id)?.replies?.push(commentMap.get(c.id)!);
          } else {
            roots.push(commentMap.get(c.id)!);
          }
        });
        setComments(roots);
      } catch (e) {
        console.warn('[WatchVideo] getCommentsForVideo failed', e);
      }

      setEditTitle(fetchedVideo.title);
      setEditDescription(fetchedVideo.description || '');
      setEditTags(fetchedVideo.tags?.join(', ') || '');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to fetch video details.');
    } finally {
      setIsLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    if (!isSessionLoading) fetchVideoDetails();
  }, [isSessionLoading, fetchVideoDetails]);

  const handleLikeToggle = async () => {
    if (!user) {
      toast.error('You must be logged in to like a video.');
      return;
    }
    if (!id) return;

    try {
      if (isLiked) {
        await removeLike(user.id, id);
        setLikes((p) => Math.max(0, p - 1));
        setIsLiked(false);
        toast.success('Video unliked!');
      } else {
        await addLike(user.id, id);
        setLikes((p) => p + 1);
        setIsLiked(true);
        toast.success('Video liked!');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Failed to update like status.');
    }
  };

  const handlePostComment = async (parentCommentId: string | null = null) => {
    if (!user) {
      toast.error('You must be logged in to post a comment.');
      return;
    }
    const textToPost = parentCommentId ? replyText : newCommentText;
    if (!id || !textToPost.trim()) {
      toast.error('Comment cannot be empty.');
      return;
    }
    try {
      const addedComment = await addComment(id, user.id, textToPost, parentCommentId);
      if (addedComment) {
        toast.success(parentCommentId ? 'Reply posted!' : 'Comment posted!');
        setNewCommentText('');
        setReplyText('');
        setReplyingToCommentId(null);
        fetchVideoDetails();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Failed to post comment.');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) {
      toast.error('You must be logged in to delete a comment.');
      return;
    }
    try {
      await deleteComment(commentId);
      toast.success('Comment deleted!');
      fetchVideoDetails();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Failed to delete comment.');
    }
  };

  const handleDeleteVideo = async () => {
    if (!user || !video || user.id !== video.user_id) {
      toast.error('You are not authorized to delete this video.');
      return;
    }
    if (!id) return;
    try {
      await deleteVideo(id);
      toast.success('Video deleted successfully!');
      navigate('/');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Failed to delete video.');
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const handleEditVideo = async () => {
    if (!user || !video || user.id !== video.user_id) {
      toast.error('You are not authorized to edit this video.');
      return;
    }
    if (!id) return;
    setIsSubscribing(true);
    const loadingToastId = toast.loading('Updating video details...');
    try {
      const updatedTags = editTags ? editTags.split(',').map((t) => t.trim()).filter(Boolean) : [];
      const updatedVideo = await updateVideoMetadata(id, {
        title: editTitle,
        description: editDescription,
        tags: updatedTags,
      });
      if (updatedVideo) {
        setVideo(updatedVideo);
        toast.success('Video updated successfully!', { id: loadingToastId });
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Failed to update video.', { id: loadingToastId });
    } finally {
      setIsEditDialogOpen(false);
      setIsSubscribing(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!user || !uploaderProfile) {
      toast.error('You must be logged in to follow a creator.');
      return;
    }
    if (user.id === uploaderProfile.id) {
      toast.info("You cannot follow yourself.");
      return;
    }
    setIsSubscribing(true);
    try {
      if (isFollowingUploader) {
        await removeSubscription(user.id, uploaderProfile.id);
        setIsFollowingUploader(false);
        toast.success(`Unfollowed ${uploaderProfile.first_name || 'creator'}.`);
      } else {
        await addSubscription(user.id, uploaderProfile.id);
        setIsFollowingUploader(true);
        toast.success(`Now following ${uploaderProfile.first_name || 'creator'}!`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Failed to update subscription status.');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleShareVideo = async () => {
    if (!video) {
      toast.error('No video to share.');
      return;
    }
    const videoUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(videoUrl);
      toast.success('Video link copied to clipboard!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to copy link. Please try again.');
    }
  };

  const renderComments = (commentList: CommentWithProfile[]) =>
    commentList.map((comment) => (
      <div key={comment.id} className="flex items-start space-x-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.profiles?.avatar_url || undefined} alt={comment.profiles?.first_name || 'Commenter'} />
          <AvatarFallback>
            <LucideUser className="h-4 w-4 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-sm">
              {comment.profiles?.first_name} {comment.profiles?.last_name}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(comment.created_at).toLocaleString()}
            </span>
          </div>
          <p className="text-sm">{comment.text}</p>
          <div className="flex space-x-2 mt-2">
            {user && user.id === comment.user_id && (
              <Button variant="ghost" size="sm" className="h-auto px-0 py-1 text-xs text-red-500 hover:text-red-700" onClick={() => handleDeleteComment(comment.id)}>
                Delete
              </Button>
            )}
            {user && (
              <Button variant="ghost" size="sm" className="h-auto px-0 py-1 text-xs text-primary hover:text-primary/80" onClick={() => { setReplyingToCommentId(comment.id); setReplyText(''); }}>
                Reply
              </Button>
            )}
          </div>

          {comment.replies && comment.replies.length > 0 && (
            <div className="ml-8 mt-4 space-y-4 border-l pl-4">
              {renderComments(comment.replies)}
            </div>
          )}
        </div>
      </div>
    ));

  if (isLoading) {
    return <div className="text-center text-muted-foreground">Loading video...</div>;
  }

  if (error) {
    return <div className="text-center text-destructive-foreground bg-destructive p-4 rounded-md">{error}</div>;
  }

  if (!video) {
    return <div className="text-center text-muted-foreground">Video not found.</div>;
  }

  const isOwner = user && user.id === video.user_id;

  // Helper to read views consistently
  const getViews = () => {
    // prefer video.video_stats[0].views if present, else fallback to video.views
    // @ts-ignore
    if (Array.isArray(video.video_stats) && video.video_stats.length > 0 && typeof video.video_stats[0].views === 'number') {
      // @ts-ignore
      return video.video_stats[0].views;
    }
    // @ts-ignore
    if (typeof video.views === 'number') return video.views;
    return 0;
  };

  return (
    <div className="container mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        {/* Pass threshold handler to the player */}
        <VideoPlayer videoUrl={video.video_url} title={video.title} onProgressThresholdMet={() => handleVideoProgressThresholdMet(video.id)} />

        {/* DEBUG button - temporary: helps confirm handler and backend */}
        <div className="mt-3 flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => {
              console.debug('[DEBUG] manual trigger of handleVideoProgressThresholdMet');
              handleVideoProgressThresholdMet(video.id);
            }}
          >
            Force view increment (debug)
          </Button>
          <div className="text-sm text-muted-foreground">session key: {`video_viewed_50_${video.id}`}</div>
        </div>

        <h1 className="text-3xl font-bold mt-4 mb-2">{video.title}</h1>

        <div className="flex items-center justify-between text-muted-foreground text-sm mb-4">
          <div className="flex items-center space-x-4">
            <p>{getViews()} views</p>
            <p>{new Date(video.created_at).toLocaleDateString()}</p>
            {video.status === 'draft' && <Badge variant="secondary">Draft</Badge>}
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={handleLikeToggle} className={isLiked ? 'text-red-500' : ''}>
              <Heart className="h-5 w-5" fill={isLiked ? 'currentColor' : 'none'} />
            </Button>
            <span className="text-sm">{likes}</span>

            <Button variant="ghost" size="icon" onClick={handleShareVideo}>
              <Share2 className="h-5 w-5" />
            </Button>

            {isOwner && (
              <>
                <Button variant="ghost" size="icon" onClick={() => setIsEditDialogOpen(true)}>
                  <Edit className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setIsDeleteDialogOpen(true)}>
                  <Trash2 className="h-5 w-5 text-red-500" />
                </Button>
              </>
            )}

            {!isOwner && user && (
              <Button variant="ghost" size="icon" onClick={() => toast.info('Reporting feature coming soon!')}>
                <Flag className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {video.tags?.map((tag, index) => (
            <Badge key={index} variant="secondary">{tag}</Badge>
          ))}
        </div>

        <p className="text-muted-foreground mb-6">{video.description}</p>

        {/* Uploader Info */}
        <div className="flex items-center space-x-4 border-t border-b py-4 mb-6">
          <Avatar className="h-12 w-12">
            <AvatarImage src={uploaderProfile?.avatar_url || undefined} alt={uploaderProfile?.first_name || 'Uploader'} />
            <AvatarFallback>
              <LucideUser className="h-6 w-6 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Link to={`/profile/${uploaderProfile?.id}`} className="font-semibold hover:underline">
              {uploaderProfile?.first_name} {uploaderProfile?.last_name}
            </Link>
            <p className="text-sm text-muted-foreground">Uploader</p>
          </div>
          {!isOwner && user && uploaderProfile && (
            <Button
              variant={isFollowingUploader ? 'secondary' : 'default'}
              onClick={handleFollowToggle}
              disabled={isSubscribing}
            >
              {isSubscribing ? '...' : isFollowingUploader ? <><Check className="mr-2 h-4 w-4" /> Following</> : <><Plus className="mr-2 h-4 w-4" /> Follow</>}
            </Button>
          )}
        </div>

        {/* Comments */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">{comments.length} Comments</h2>
          {user && (
            <div className="mb-6">
              <Textarea placeholder="Add a comment..." value={newCommentText} onChange={(e) => setNewCommentText(e.target.value)} className="mb-2" />
              <Button onClick={() => handlePostComment()} disabled={!newCommentText.trim()}>
                Post Comment
              </Button>
            </div>
          )}
          <div className="space-y-4">
            {renderComments(comments)}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-1">
        <h2 className="text-2xl font-bold mb-4">Related Videos</h2>
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-md text-muted-foreground">More videos coming soon!</div>
        </div>
      </div>

      {/* Delete dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>This action cannot be undone. This will permanently delete your video and all associated data.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteVideo}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Video Details</DialogTitle>
            <DialogDescription>Make changes to your video's title, description, and tags here.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editTitle" className="text-right">Title</Label>
              <Input id="editTitle" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editDescription" className="text-right">Description</Label>
              <Textarea id="editDescription" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editTags" className="text-right">Tags</Label>
              <Input id="editTags" value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="comma, separated, tags" className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditVideo} disabled={isSubscribing}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reply dialog */}
      <Dialog open={!!replyingToCommentId} onOpenChange={() => setReplyingToCommentId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to Comment</DialogTitle>
            <DialogDescription>Replying to a comment.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea placeholder="Write your reply..." value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={4} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyingToCommentId(null)}>Cancel</Button>
            <Button onClick={() => handlePostComment(replyingToCommentId)} disabled={!replyText.trim()}>Post Reply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WatchVideo;