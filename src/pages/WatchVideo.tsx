import React, { useEffect, useState, useCallback } from 'react';
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
  CommentWithProfile,
} from '@/lib/video-store';
import CustomVideoPlayer from '@/components/CustomVideoPlayer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Heart,
  ThumbsDown,
  Trash2,
  Edit,
  User as LucideUser,
  Plus,
  Check,
  Flag,
  Share2,
  History,
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
 * WatchVideo
 * - Visual refresh: player card, bold title, tidy meta, neat action row (like/dislike/share/subscribe)
 * - Like/dislike UI implemented client-side (optimistic). Wire to backend endpoints if available.
 * - Keeps existing behavior (comments, edit/delete dialogs, view increment) intact.
 *
 * Notes:
 * - If you have dislike endpoints in your API, replace the local logic with calls to your API.
 * - Styling uses Tailwind classes that match the existing project (you can adapt colors easily).
 */

const WatchVideo: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading: isSessionLoading } = useSession();

  const [video, setVideo] = useState<Video | null>(null);
  const [uploaderProfile, setUploaderProfile] = useState<Profile | null>(null);
  const [likes, setLikes] = useState<number>(0);
  const [isLiked, setIsLiked] = useState<boolean>(false);

  // Local optimistic dislike state. Replace with backend counts if available.
  const [dislikes, setDislikes] = useState<number>(0);
  const [isDisliked, setIsDisliked] = useState<boolean>(false);

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

  const handleVideoProgressThresholdMet = useCallback(
    async (videoId: string) => {
      const viewKey = `video_viewed_50_${videoId}`;
      if (!sessionStorage.getItem(viewKey)) {
        if (video?.status === 'published') {
          try {
            await incrementVideoView(videoId);
          } catch (err: any) {
            console.error('Failed to increment view', err);
            toast.error(`Failed to increment view: ${err.message}`);
          }
        }
        if (user) {
          try {
            await addVideoToHistory(user.id, videoId);
          } catch (err: any) {
            console.error('Failed to add to history', err);
          }
        }
        sessionStorage.setItem(viewKey, 'true');
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

      // Show blocked page with message but still set video so UI can present thumbnail/title
      if (fetchedVideo.status === 'blocked') {
        setError('This video has been blocked due to content policy violations.');
        setVideo(fetchedVideo);
        setIsLoading(false);
        return;
      }

      setVideo(fetchedVideo);
      setUploaderProfile(fetchedVideo.creator_profiles || null);

      // Likes (backend)
      const fetchedLikes = await getLikesForVideo(id);
      setLikes(fetchedLikes.length);
      if (user) {
        setIsLiked(fetchedLikes.some((l) => l.user_id === user.id));
      }

      // NOTE: if you have dislike endpoints, fetch them here and setDislikes accordingly

      // Comments + building threaded structure
      const fetchedComments = await getCommentsForVideo(id);
      const commentMap = new Map<string, CommentWithProfile>();
      fetchedComments.forEach((comment) => {
        if (comment.creator_profiles) {
          commentMap.set(comment.id, { ...comment, creator_profiles: comment.creator_profiles, replies: [] });
        }
      });
      const rootComments: CommentWithProfile[] = [];
      fetchedComments.forEach((comment) => {
        if (!comment.creator_profiles) return;
        if (comment.parent_comment_id && commentMap.has(comment.parent_comment_id)) {
          commentMap.get(comment.parent_comment_id)?.replies?.push(commentMap.get(comment.id)!);
        } else {
          rootComments.push(commentMap.get(comment.id)!);
        }
      });
      setComments(rootComments);

      setEditTitle(fetchedVideo.title);
      setEditDescription(fetchedVideo.description || '');
      setEditTags(fetchedVideo.tags?.join(', ') || '');

      if (user && fetchedVideo.user_id !== user.id) {
        const followingStatus = await isFollowing(user.id, fetchedVideo.user_id);
        setIsFollowingUploader(followingStatus);
      }
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
        toast.success('Removed like');
      } else {
        // If user had disliked, remove that locally
        if (isDisliked) {
          setDislikes((p) => Math.max(0, p - 1));
          setIsDisliked(false);
        }
        await addLike(user.id, id);
        setLikes((p) => p + 1);
        setIsLiked(true);
        toast.success('Liked');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Failed to update like status.');
    }
  };

  // Local optimistic dislike handler (replace with backend if available)
  const handleDislikeToggle = () => {
    if (!user) {
      toast.error('You must be logged in to dislike.');
      return;
    }
    // Toggle local state. If liked, remove like first.
    if (isDisliked) {
      setDislikes((p) => Math.max(0, p - 1));
      setIsDisliked(false);
      toast.success('Removed dislike');
    } else {
      if (isLiked) {
        // remove the like locally and backend
        setIsLiked(false);
        setLikes((p) => Math.max(0, p - 1));
        // Fire removeLike to backend to keep consistent
        removeLike(user.id, id!).catch((e) => console.warn('failed to remove like when disliking', e));
      }
      setDislikes((p) => p + 1);
      setIsDisliked(true);
      toast.success('Disliked');
    }
    // TODO: call your backend dislike endpoints here if you have them
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
      const updatedTags = editTags
        ? editTags.split(',').map((t) => t.trim()).filter(Boolean)
        : [];
      const updatedVideo = await updateVideoMetadata(id, {
        title: editTitle,
        description: editDescription,
        tags: updatedTags,
      });
      if (updatedVideo) {
        setVideo(updatedVideo);
        setUploaderProfile(updatedVideo.creator_profiles || null);
        toast.success('Video updated', { id: loadingToastId });
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
      await navigator.clipboard.writeText(videoUrl);
      toast.success('Video link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy video link:', err);
      toast.error('Failed to copy link. Please try again.');
    }
  };

  const renderComments = (commentList: CommentWithProfile[]): JSX.Element[] =>
    commentList.map((comment) => (
      <div key={comment.id} className="flex items-start space-x-3">
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={comment.creator_profiles?.avatar_url || undefined}
            alt={comment.creator_profiles?.first_name || 'Commenter'}
          />
          <AvatarFallback>
            <LucideUser className="h-4 w-4 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-sm">
              {comment.creator_profiles?.first_name} {comment.creator_profiles?.last_name}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(comment.created_at).toLocaleString()}
            </span>
          </div>
          <p className="text-sm mt-1">{comment.text}</p>
          <div className="flex space-x-2 mt-2">
            {user && user.id === comment.user_id && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto px-0 py-1 text-xs text-red-500 hover:text-red-700"
                onClick={() => handleDeleteComment(comment.id)}
              >
                Delete
              </Button>
            )}
            {user && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto px-0 py-1 text-xs text-primary hover:text-primary/80"
                onClick={() => {
                  setReplyingToCommentId(comment.id);
                  setReplyText('');
                }}
              >
                Reply
              </Button>
            )}
          </div>

          {comment.replies && comment.replies.length > 0 && (
            <div className="ml-8 mt-4 space-y-4 border-l pl-4">{renderComments(comment.replies)}</div>
          )}
        </div>
      </div>
    ));

  if (isLoading) {
    return <div className="text-center text-muted-foreground py-10">Loading video...</div>;
  }

  if (error) {
    if (video && video.status === 'blocked') {
      const isOwner = user && user.id === video.user_id;
      return (
        <div className="container mx-auto p-4 max-w-4xl text-center">
          <div className="bg-card p-8 rounded-lg shadow-lg">
            <h1 className="text-4xl font-bold mb-4">{video.title}</h1>
            {video.thumbnail_url && (
              <img
                src={video.thumbnail_url}
                alt={video.title}
                className="mx-auto mb-6 rounded-lg object-cover w-full max-w-md"
              />
            )}
            <p className="text-xl text-muted-foreground mb-6">
              This video has been blocked due to content policy violations.
            </p>
            {isOwner && <p className="text-sm text-muted-foreground">Please review content guidelines or contact support.</p>}
            <Button onClick={() => navigate('/')} className="mt-6">
              Return to Home
            </Button>
          </div>
        </div>
      );
    }
    return <div className="text-center text-destructive-foreground bg-destructive p-4 rounded-md">{error}</div>;
  }

  if (!video) {
    return <div className="text-center text-muted-foreground py-10">Video not found.</div>;
  }

  const isOwner = user && user.id === video.user_id;

  return (
    <div className="container mx-auto p-4">
      {/* Top layout: player card + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Player card */}
          <div className="rounded-lg overflow-hidden bg-gradient-to-b from-white/6 to-white/3 backdrop-blur-md shadow-xl border border-white/6">
            <div className="h-1 bg-gradient-to-r from-indigo-500 via-pink-400 to-yellow-400" />
            <div className="p-4">
              <div className="rounded-md overflow-hidden bg-black">
                <CustomVideoPlayer
                  videoUrl={video.video_url}
                  title={video.title}
                  thumbnailUrl={video.thumbnail_url}
                  onProgressThresholdMet={handleVideoProgressThresholdMet}
                  videoId={video.id}
                />
              </div>
            </div>
          </div>

          {/* Title + uploader row */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-2">{video.title}</h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Link to={`/profile/${video.user_id}`} className="flex items-center gap-3 hover:underline">
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={video.creator_profiles?.avatar_url || undefined}
                      alt={video.creator_profiles?.first_name || 'Creator'}
                    />
                    <AvatarFallback>
                      <LucideUser className="h-5 w-5 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-foreground">
                      {video.creator_profiles
                        ? `${video.creator_profiles.first_name || ''} ${video.creator_profiles.last_name || ''}`.trim() ||
                          'Unknown Creator'
                        : 'Loading Creator...'}
                    </div>
                    <div className="text-xs text-muted-foreground">Uploader</div>
                  </div>
                </Link>

                <div className="flex items-center gap-2 ml-2">
                  <div className="text-xs">{video.video_stats?.[0]?.views || 0} views</div>
                  <div className="text-xs">•</div>
                  <div className="text-xs">{new Date(video.created_at).toLocaleDateString()}</div>
                  {video.status === 'draft' && <Badge variant="secondary" className="ml-2">Draft</Badge>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Subscribe / Join Crew */}
              {!isOwner && user && video.creator_profiles && (
                <Button
                  variant={isFollowingUploader ? 'secondary' : 'default'}
                  onClick={handleFollowToggle}
                  disabled={isSubscribing}
                  className="whitespace-nowrap"
                >
                  {isSubscribing ? '...' : isFollowingUploader ? <><Check className="mr-2 h-4 w-4" /> Joined</> : <><Plus className="mr-2 h-4 w-4" /> Join Crew</>}
                </Button>
              )}
              {isOwner && (
                <div className="text-sm text-muted-foreground">You are the uploader</div>
              )}
            </div>
          </div>

          {/* Action row (like / dislike / share / save) */}
          <div className="flex items-center justify-between py-4 border-t border-b">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLikeToggle}
                className={`flex items-center gap-2 ${isLiked ? 'text-red-500' : 'text-muted-foreground'} hover:text-red-500`}
                title="Like"
              >
                <Heart className="h-5 w-5" />
                <span className="text-sm">{likes}</span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleDislikeToggle}
                className={`flex items-center gap-2 ${isDisliked ? 'text-slate-400' : 'text-muted-foreground'} hover:text-foreground`}
                title="Dislike"
              >
                <ThumbsDown className="h-5 w-5" />
                <span className="text-sm">{dislikes}</span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleShareVideo}
                className="text-muted-foreground hover:text-foreground"
                title="Share"
              >
                <Share2 className="h-5 w-5" />
                <span className="sr-only">Share</span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => toast.info('Save to watch later (coming soon)')}
                className="text-muted-foreground hover:text-foreground"
              >
                <History className="h-5 w-5" />
                <span className="sr-only">Save</span>
              </Button>
            </div>

            <div className="flex items-center gap-3">
              {isOwner && (
                <>
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(true)} className="text-sm">
                    <Edit className="h-4 w-4 mr-2" /> Edit
                  </Button>
                  <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} className="text-sm">
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </Button>
                </>
              )}

              {!isOwner && user && (
                <Button variant="ghost" onClick={() => toast.info('Report feature coming soon!')}>
                  <Flag className="h-4 w-4 mr-2" /> Report
                </Button>
              )}
            </div>
          </div>

          {/* Tags + Description */}
          <div className="py-4">
            <div className="flex flex-wrap gap-2 mb-3">
              {video.tags?.map((tag, idx) => (
                <Badge key={idx} variant="secondary" className="text-sm px-3 py-1">{tag}</Badge>
              ))}
            </div>
            <p className="text-base text-foreground leading-relaxed">{video.description}</p>
          </div>

          {/* Uploader card */}
          <div className="flex items-center gap-4 py-4 border-t">
            <Avatar className="h-14 w-14">
              <AvatarImage src={video.creator_profiles?.avatar_url || undefined} alt={video.creator_profiles?.first_name || 'Uploader'} />
              <AvatarFallback>
                <LucideUser className="h-7 w-7 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Link to={`/profile/${video.user_id}`} className="font-semibold text-lg hover:underline">
                {video.creator_profiles ? `${video.creator_profiles.first_name || ''} ${video.creator_profiles.last_name || ''}`.trim() || 'Unknown Creator' : 'Loading Creator...'}
              </Link>
              <p className="text-sm text-muted-foreground">Uploader</p>
            </div>

            {!isOwner && user && video.creator_profiles && (
              <Button
                variant={isFollowingUploader ? 'secondary' : 'default'}
                onClick={handleFollowToggle}
                disabled={isSubscribing}
              >
                {isSubscribing ? '...' : isFollowingUploader ? <><Check className="mr-2 h-4 w-4" /> Joined</> : <><Plus className="mr-2 h-4 w-4" /> Join Crew</>}
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
            <div className="space-y-6">{renderComments(comments)}</div>
          </div>
        </div>

        {/* Right sidebar */}
        <aside className="lg:col-span-1">
          <div className="sticky top-20 space-y-4">
            <h3 className="text-lg font-semibold">Up next</h3>
            <div className="space-y-3">
              {/* Placeholder related items — replace with real data */}
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3 items-start p-2 rounded hover:bg-white/4 transition cursor-pointer">
                  <div className="w-28 h-16 bg-slate-200 rounded-md overflow-hidden" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Related video {i + 1}</div>
                    <div className="text-xs text-muted-foreground mt-1">by uploader • 2:13</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
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