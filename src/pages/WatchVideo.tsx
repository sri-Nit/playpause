import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getVideoById,
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
  addVideoToHistory,
  CommentWithProfile
} from '@/lib/video-store';
import CustomVideoPlayer from '@/components/CustomVideoPlayer';
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
  History,
  ThumbsDown,
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
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const DESCRIPTION_TRIM_LENGTH = 360;

const WatchVideo: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading: isSessionLoading } = useSession();

  const [video, setVideo] = useState<Video | null>(null);
  const [uploaderProfile, setUploaderProfile] = useState<Profile | null>(null);
  const [likes, setLikes] = useState<number>(0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isDisliked, setIsDisliked] = useState<boolean>(false);
  const [likeLoading, setLikeLoading] = useState(false);
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
  const [descriptionOpen, setDescriptionOpen] = useState(false);

  // Called by the player when user crosses the view-threshold (e.g., 50% watched)
  const handleVideoProgressThresholdMet = useCallback(async (videoId: string) => {
    const viewKey = `video_viewed_50_${videoId}`;

    if (!sessionStorage.getItem(viewKey)) {
      if (video?.status === 'published') {
        try {
          await incrementVideoView(videoId);
        } catch (err: any) {
          console.error('Failed to increment view:', err);
          toast.error(`Failed to increment view: ${err?.message || 'Network error'}`);
        }
      }
      if (user) {
        try {
          await addVideoToHistory(user.id, videoId);
        } catch (err: any) {
          console.error('Failed to add to history:', err);
        }
      }
      sessionStorage.setItem(viewKey, 'true');
    }
  }, [user, video?.status]);

  // Fetch video, likes and comments
  const fetchVideoDetails = useCallback(async () => {
    if (!id) {
      setError('Video ID is missing.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const fetchedVideo = await getVideoById(id);
      if (!fetchedVideo) {
        setError('Video not found.');
        setVideo(null);
        return;
      }

      // Access control for drafts
      if (fetchedVideo.status === 'draft' && (!user || user.id !== fetchedVideo.user_id)) {
        setError('This video is a draft and not publicly available.');
        setVideo(null);
        return;
      }

      // If blocked, still show limited info
      if (fetchedVideo.status === 'blocked') {
        setVideo(fetchedVideo);
        setError('This video has been blocked due to content policy violations.');
        return;
      }

      setVideo(fetchedVideo);
      setUploaderProfile(fetchedVideo.creator_profiles || null);

      // Likes
      const fetchedLikes = await getLikesForVideo(id);
      setLikes(fetchedLikes.length);
      if (user) {
        setIsLiked(fetchedLikes.some(l => l.user_id === user.id && l.type !== 'down'));
        setIsDisliked(fetchedLikes.some(l => l.user_id === user.id && l.type === 'down'));
      } else {
        setIsLiked(false);
        setIsDisliked(false);
      }

      if (user && fetchedVideo.user_id !== user.id) {
        const followingStatus = await isFollowing(user.id, fetchedVideo.user_id);
        setIsFollowingUploader(followingStatus);
      }

      // Comments -> build tree with replies (CommentWithProfile expected)
      const fetchedComments = await getCommentsForVideo(id);
      const commentMap = new Map<string, CommentWithProfile>();
      fetchedComments.forEach(c => {
        if (c.creator_profiles) {
          commentMap.set(c.id, { ...c, replies: [] });
        } else {
          // Provide a minimal fallback profile to avoid rendering breaks
          commentMap.set(c.id, { ...c, creator_profiles: undefined, replies: [] } as CommentWithProfile);
        }
      });

      const roots: CommentWithProfile[] = [];
      fetchedComments.forEach(c => {
        const mapped = commentMap.get(c.id)!;
        if (c.parent_comment_id && commentMap.has(c.parent_comment_id)) {
          commentMap.get(c.parent_comment_id)!.replies!.push(mapped);
        } else {
          roots.push(mapped);
        }
      });
      setComments(roots);

      // Prefill edit fields if owner
      setEditTitle(fetchedVideo.title || '');
      setEditDescription(fetchedVideo.description || '');
      setEditTags((fetchedVideo.tags || []).join(', '));
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to fetch video details.');
    } finally {
      setIsLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    if (!isSessionLoading) {
      fetchVideoDetails();
    }
  }, [isSessionLoading, fetchVideoDetails]);

  // Like/dislike toggle (optimistic + disabled while running)
  const handleLikeToggle = async (type: 'up' | 'down') => {
    if (!user) {
      toast.error('You must be logged in to like a video.');
      return;
    }
    if (!id || likeLoading) return;

    setLikeLoading(true);
    try {
      const currentlyLiked = isLiked && type === 'up';
      const currentlyDisliked = isDisliked && type === 'down';

      // If toggling same state -> remove
      if ((type === 'up' && currentlyLiked) || (type === 'down' && currentlyDisliked)) {
        await removeLike(user.id, id);
        setLikes(prev => Math.max(0, prev - 1));
        if (type === 'up') setIsLiked(false);
        else setIsDisliked(false);
        toast.success(type === 'up' ? 'Removed like' : 'Removed dislike');
      } else {
        // If switching from other reaction, remove previous then add new.
        if (isLiked && type === 'down') {
          // remove previous like
          await removeLike(user.id, id);
          setLikes(prev => Math.max(0, prev - 1));
          setIsLiked(false);
        } else if (isDisliked && type === 'up') {
          await removeLike(user.id, id);
          setIsDisliked(false);
        }

        await addLike(user.id, id, type === 'down' ? 'down' : 'up');
        setLikes(prev => prev + 1);
        setIsLiked(type === 'up');
        setIsDisliked(type === 'down');
        toast.success(type === 'up' ? 'You liked the video' : 'You disliked the video');
      }
    } catch (err: any) {
      console.error('Like toggle failed', err);
      toast.error(err?.message || 'Failed to update reaction');
    } finally {
      setLikeLoading(false);
    }
  };

  const handlePostComment = async (parentCommentId: string | null = null) => {
    if (!user) {
      toast.error('You must be logged in to post a comment.');
      return;
    }
    const text = parentCommentId ? replyText.trim() : newCommentText.trim();
    if (!text) {
      toast.error('Comment cannot be empty.');
      return;
    }
    try {
      // optimistic UI: push a temporary comment while network resolves
      const tempId = `temp_${Date.now()}`;
      const tempComment: CommentWithProfile = {
        id: tempId,
        user_id: user.id,
        text,
        created_at: new Date().toISOString(),
        creator_profiles: { id: user.id, first_name: (user.name || '').split(' ')[0] || 'You', last_name: '', avatar_url: user.avatar_url || undefined } as any,
        parent_comment_id: parentCommentId || undefined,
        replies: []
      } as CommentWithProfile;

      if (!parentCommentId) {
        setComments(prev => [tempComment, ...prev]);
        setNewCommentText('');
      } else {
        // Attach to parent in a shallow way
        setComments(prev => prev.map(c => {
          if (c.id === parentCommentId) {
            return { ...c, replies: [tempComment, ...(c.replies || [])] };
          }
          return c;
        }));
        setReplyText('');
        setReplyingToCommentId(null);
      }

      const added = await addComment(id!, user.id, text, parentCommentId);
      if (added) {
        // Refresh server-sourced comments to get canonical ids and profiles
        await fetchVideoDetails();
        toast.success(parentCommentId ? 'Reply posted!' : 'Comment posted!');
      } else {
        toast.error('Failed to post comment.');
        // fallback to refetch
        await fetchVideoDetails();
      }
    } catch (err: any) {
      console.error('Failed to post comment', err);
      toast.error(err?.message || 'Failed to post comment.');
      await fetchVideoDetails();
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
      await fetchVideoDetails();
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
      const updatedTags = editTags ? editTags.split(',').map(t => t.trim()).filter(Boolean) : [];
      const updatedVideo = await updateVideoMetadata(id, {
        title: editTitle,
        description: editDescription,
        tags: updatedTags,
      });
      if (updatedVideo) {
        setVideo(updatedVideo);
        setUploaderProfile(updatedVideo.creator_profiles || null);
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
      toast.error('You must be logged in to join a crew.');
      return;
    }
    if (user.id === uploaderProfile.id) {
      toast.info("You cannot join your own crew.");
      return;
    }

    setIsSubscribing(true);
    try {
      if (isFollowingUploader) {
        await removeSubscription(user.id, uploaderProfile.id);
        setIsFollowingUploader(false);
        toast.success(`Left ${uploaderProfile.first_name || 'creator'}'s crew.`);
      } else {
        await addSubscription(user.id, uploaderProfile.id);
        setIsFollowingUploader(true);
        toast.success(`Joined ${uploaderProfile.first_name || 'creator'}'s crew!`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Failed to update crew status.');
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
      if ((navigator as any).share) {
        await (navigator as any).share({ title: video.title, url: videoUrl });
        toast.success('Shared!');
        return;
      }
      await navigator.clipboard.writeText(videoUrl);
      toast.success('Video link copied to clipboard!');
    } catch (err) {
      console.error('Failed to share/copy link:', err);
      toast.error('Failed to share. Try copying manually.');
    }
  };

  const renderComments = (commentList: CommentWithProfile[]): JSX.Element[] => {
    return commentList.map((comment) => (
      <div key={comment.id} className="flex items-start space-x-3">
        <Avatar className="h-8 w-8">
          {comment.creator_profiles?.avatar_url ? (
            <AvatarImage src={comment.creator_profiles.avatar_url} alt={comment.creator_profiles.first_name || 'Commenter'} />
          ) : (
            <AvatarFallback>
              <LucideUser className="h-4 w-4 text-muted-foreground" />
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-sm">
              {comment.creator_profiles ? `${comment.creator_profiles.first_name || ''} ${comment.creator_profiles.last_name || ''}`.trim() : 'Unknown'}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(comment.created_at).toLocaleString()}
            </span>
          </div>
          <p className="text-sm mt-1">{comment.text}</p>
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
  };

  // Derived UI values
  const isOwner = useMemo(() => !!(user && video && user.id === video.user_id), [user, video]);
  const viewsCount = video?.video_stats?.[0]?.views ?? video?.views ?? 0;

  // Description trimming logic
  const descriptionIsLong = useMemo(() => (video?.description || '').length > DESCRIPTION_TRIM_LENGTH, [video]);
  const shortDescription = useMemo(() => {
    if (!video?.description) return '';
    return video.description.slice(0, DESCRIPTION_TRIM_LENGTH).trim();
  }, [video]);

  if (isLoading) {
    return <div className="text-center text-muted-foreground py-10">Loading video...</div>;
  }

  if (error) {
    if (video && video.status === 'blocked') {
      const owner = user && user.id === video.user_id;
      return (
        <div className="container mx-auto p-4 max-w-4xl text-center">
          <div className="bg-card p-8 rounded-lg shadow-lg">
            <h1 className="text-4xl font-bold mb-4">{video.title}</h1>
            {video.thumbnail_url && (
              <img src={video.thumbnail_url} alt={video.title} className="mx-auto mb-6 rounded-lg object-cover w-full max-w-md" />
            )}
            <p className="text-xl text-muted-foreground mb-6">This video has been blocked due to content policy violations.</p>
            {owner && <p className="text-sm text-muted-foreground">Please review our content guidelines or contact support for more information.</p>}
            <Button onClick={() => navigate('/')} className="mt-6">Return to Home</Button>
          </div>
        </div>
      );
    }
    return <div className="text-center text-destructive-foreground bg-destructive p-4 rounded-md">{error}</div>;
  }

  if (!video) {
    return <div className="text-center text-muted-foreground py-10">Video not found.</div>;
  }

  return (
    <div className="container mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="video-card rounded-lg overflow-hidden shadow-md">
          <CustomVideoPlayer
            videoUrl={video.video_url}
            title={video.title}
            thumbnailUrl={video.thumbnail_url}
            onProgressThresholdMet={handleVideoProgressThresholdMet}
            videoId={video.id}
          />
        </div>

        <div className="pb-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-extrabold mb-2 leading-tight">{video.title}</h1>
              <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                <Link to={`/profile/${video.user_id}`} className="flex items-center space-x-2 hover:underline">
                  <Avatar className="h-10 w-10">
                    {video.creator_profiles?.avatar_url ? (
                      <AvatarImage src={video.creator_profiles.avatar_url} alt={video.creator_profiles.first_name || 'Creator'} />
                    ) : (
                      <AvatarFallback>
                        <LucideUser className="h-5 w-5 text-muted-foreground" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="font-medium">
                    {video.creator_profiles ? `${video.creator_profiles.first_name || ''} ${video.creator_profiles.last_name || ''}`.trim() || 'Unknown Creator' : 'Loading Creator...'}
                  </span>
                </Link>

                <span className="text-sm">•</span>
                <span className="text-sm">{viewsCount} views</span>
                <span className="text-sm">•</span>
                <span className="text-sm">{new Date(video.created_at).toLocaleDateString()}</span>
                {video.status === 'draft' && <Badge variant="secondary" className="ml-2">Draft</Badge>}
              </div>
            </div>

            <div className="flex flex-col items-end space-y-2">
              {!isOwner && user && video.creator_profiles && (
                <Button
                  onClick={handleFollowToggle}
                  disabled={isSubscribing}
                  className={`transform transition-all ${isFollowingUploader ? 'scale-100' : 'hover:scale-105'}`}
                  variant={isFollowingUploader ? 'secondary' : 'default'}
                >
                  {isSubscribing ? '...' : isFollowingUploader ? <><Check className="mr-2 h-4 w-4" /> Joined Crew</> : <><Plus className="mr-2 h-4 w-4" /> Join Crew</>}
                </Button>
              )}

              {isOwner && (
                <div className="flex space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => setIsEditDialogOpen(true)}><Edit className="h-5 w-5" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setIsDeleteDialogOpen(true)} className="text-red-500"><Trash2 className="h-5 w-5" /></Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between py-4 border-t">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="icon" onClick={() => handleLikeToggle('up')} disabled={likeLoading} className={`flex items-center gap-2 ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}>
                <Heart className="h-5 w-5" fill={isLiked ? 'currentColor' : 'none'} />
                <span className="text-sm">{likes}</span>
              </Button>

              <Button variant="ghost" size="icon" onClick={() => handleLikeToggle('down')} disabled={likeLoading} className={`flex items-center gap-2 ${isDisliked ? 'text-gray-600' : 'text-muted-foreground'}`}>
                <ThumbsDown className="h-5 w-5" />
              </Button>

              <Button variant="ghost" size="icon" onClick={handleShareVideo} className="text-muted-foreground">
                <Share2 className="h-5 w-5" />
                <span className="sr-only">Share</span>
              </Button>

              <Button variant="ghost" size="icon" onClick={() => toast.info('Save to watch later — feature coming soon!')} className="text-muted-foreground">
                <History className="h-5 w-5" />
              </Button>

              {!isOwner && user && (
                <Button variant="ghost" size="icon" onClick={() => toast.info('Report received — feature coming soon!')} className="text-muted-foreground">
                  <Flag className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>

          <div className="py-4 border-t">
            <div className="flex flex-wrap gap-2 mb-3">
              {(video.tags || []).map((tag, i) => <Badge key={i} variant="secondary" className="text-sm px-3 py-1">{tag}</Badge>)}
            </div>

            <div className="prose max-w-none text-sm">
              {descriptionIsLong && !descriptionOpen ? (
                <>
                  <p>{shortDescription}…</p>
                  <button onClick={() => setDescriptionOpen(true)} className="text-primary font-semibold">Show more</button>
                </>
              ) : (
                <>
                  <p className="whitespace-pre-wrap">{video.description}</p>
                  {descriptionIsLong && <button onClick={() => setDescriptionOpen(false)} className="text-primary font-semibold mt-2 inline-block">Show less</button>}
                </>
              )}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">{comments.length} Comments</h2>

          {user ? (
            <div className="mb-6">
              <Textarea
                placeholder="Add a public comment..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                className="mb-2"
                rows={3}
              />
              <div className="flex items-center space-x-2">
                <Button onClick={() => handlePostComment()} disabled={!newCommentText.trim()}>Post Comment</Button>
                <Button variant="ghost" onClick={() => setNewCommentText('')}>Clear</Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground mb-4">Log in to post a comment.</div>
          )}

          <div className="space-y-6">
            {renderComments(comments)}
          </div>
        </div>
      </div>

      <aside className="lg:col-span-1">
        <h2 className="text-2xl font-bold mb-4">Related Videos</h2>
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-md text-muted-foreground">
            More videos coming soon! Keep your users engaged by showing playlists, recommendations, or creator series here.
          </div>
        </div>
      </aside>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your video and all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteVideo}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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