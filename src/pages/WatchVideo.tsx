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
import { ThumbsUp, MessageCircle, Trash2, Edit, User as LucideUser, Plus, Check, Flag, Share2 } from 'lucide-react';
import { useSession } from '@/components/SessionContextProvider';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useSound } from '@/hooks/useSound'; // Import the new hook

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

  const { play: playCheerSound } = useSound('/sounds/cheer.mp3', { volume: 0.7 }); // Placeholder for cheer sound
  const { play: playYaySound } = useSound('/sounds/yay.mp3', { volume: 0.7 }); // Placeholder for yay sound

  const fetchVideoDetails = useCallback(async () => {
    if (!id) {
      setError('Video ID is missing.');
      setIsLoading(false);
      return;
    }

    try {
      const fetchedVideo = await getVideoById(id);
      if (fetchedVideo) {
        // Handle different video statuses
        if (fetchedVideo.status === 'draft' && (!user || user.id !== fetchedVideo.user_id)) {
          setError('This video is a draft and not publicly available.');
          setVideo(null);
          setIsLoading(false);
          return;
        }
        if (fetchedVideo.status === 'blocked') {
          setError('This video has been blocked due to content policy violations.');
          setVideo(fetchedVideo); // Still set video to show title/thumbnail
          setIsLoading(false);
          return;
        }

        setVideo(fetchedVideo);
        setUploaderProfile(fetchedVideo.creator_profiles || null);

        const fetchedLikes = await getLikesForVideo(id);
        setLikes(fetchedLikes.length);
        if (user) {
          setIsLiked(fetchedLikes.some(like => like.user_id === user.id));
          if (fetchedVideo.user_id !== user.id) {
            const followingStatus = await isFollowing(user.id, fetchedVideo.user_id);
            setIsFollowingUploader(followingStatus);
          }
        }

        const fetchedComments = await getCommentsForVideo(id);
        const commentMap = new Map<string, CommentWithProfile>();
        fetchedComments.forEach(comment => {
          if (comment.creator_profiles) {
            commentMap.set(comment.id, { ...comment, creator_profiles: comment.creator_profiles, replies: [] });
          } else {
            console.warn(`Comment ${comment.id} is missing creator_profiles.`);
          }
        });

        const rootComments: CommentWithProfile[] = [];
        fetchedComments.forEach(comment => {
          if (comment.creator_profiles) {
            if (comment.parent_comment_id && commentMap.has(comment.parent_comment_id)) {
              commentMap.get(comment.parent_comment_id)?.replies?.push(commentMap.get(comment.id)!);
            } else {
              rootComments.push(commentMap.get(comment.id)!);
            }
          }
        });
        setComments(rootComments);

        setEditTitle(fetchedVideo.title);
        setEditDescription(fetchedVideo.description || '');
        setEditTags(fetchedVideo.tags?.join(', ') || '');
      } else {
        setError('Video not found.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch video details.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [id, user]);

  // Handle view increment when playback threshold is met
  const handleVideoProgressThresholdMet = useCallback(
    async (videoId: string) => {
      const viewKey = `video_viewed_50_${videoId}`;
      console.log(`[WatchVideo] handleVideoProgressThresholdMet called for videoId: ${videoId}`);
      console.log(`[WatchVideo] User: ${user ? user.id : 'Not authenticated'}`);
      console.log(`[WatchVideo] Video status: ${video?.status}`);

      // If we've already recorded a view for this session, skip.
      if (sessionStorage.getItem(viewKey)) {
        console.log(`[WatchVideo] View already incremented for videoId: ${videoId} in this session. Not incrementing again.`);
        return;
      }

      console.log(`[WatchVideo] View threshold met for videoId: ${videoId}. Attempting to record view.`);

      // Try to increment view count via your normal API call.
      if (video?.status === 'published') {
        try {
          await incrementVideoView(videoId);
          console.log(`[WatchVideo] View incremented successfully for videoId: ${videoId}`);
          // Refetch video details to update the view count in the UI
          fetchVideoDetails();
        } catch (err: any) {
          console.error(`[WatchVideo] Failed to increment view for videoId: ${videoId}`, err);
          toast.error('Failed to record view for this session (will not retry).');
        }
      } else {
        console.log(
          `[WatchVideo] View not incremented: Video status is not 'published' (${video?.status}).`
        );
      }

      // Best-effort: add to user's history if signed-in.
      if (user) {
        try {
          await addVideoToHistory(user.id, videoId);
          console.log(`[WatchVideo] Video added to history for user: ${user.id}`);
        } catch (err: any) {
          console.error(`[WatchVideo] Failed to add video to history for user: ${user?.id}`, err);
          // don't block flow for history failures
        }
      }

      // Mark this video as counted for this session so we don't repeat the above.
      try {
        sessionStorage.setItem(viewKey, 'true');
        console.log(`[WatchVideo] sessionStorage key '${viewKey}' set.`);
      } catch (err) {
        console.warn('[WatchVideo] Failed to set sessionStorage key:', err);
      }
    },
    // Keep dependency on user, video?.status, and fetchVideoDetails so handler updates when they change
    [user, video?.status, fetchVideoDetails]
  );

  useEffect(() => {
    if (!isSessionLoading) {
      fetchVideoDetails();
    }
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
        setLikes(prev => Math.max(0, prev - 1));
        setIsLiked(false);
        toast.success('Video unliked!');
      } else {
        await addLike(user.id, id);
        setLikes(prev => prev + 1);
        setIsLiked(true);
        playCheerSound(); // Play cheer sound on like
        toast.success('Video liked!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update like status.');
      console.error(err);
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
      toast.error(err.message || 'Failed to post comment.');
      console.error(err);
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
      toast.error(err.message || 'Failed to delete comment.');
      console.error(err);
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
      toast.error(err.message || 'Failed to delete video.');
      console.error(err);
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
      const updatedTags = editTags ? editTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];
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
      toast.error(err.message || 'Failed to update video.', { id: loadingToastId });
      console.error(err);
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
        playYaySound(); // Play yay sound on subscribe
        toast.success(`Joined ${uploaderProfile.first_name || 'creator'}'s crew!`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update crew status.');
      console.error(err);
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

  const renderComments = (commentList: CommentWithProfile[]): JSX.Element[] => {
    return commentList.map((comment) => (
      <div key={comment.id} className="flex items-start space-x-3 p-4 rounded-lg bg-background border border-border shadow-sm">
        <Avatar className="h-9 w-9">
          <AvatarImage src={comment.creator_profiles?.avatar_url || undefined} alt={comment.creator_profiles?.first_name || 'Commenter'} />
          <AvatarFallback className="bg-secondary text-secondary-foreground">
            <LucideUser className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-semibold text-sm text-foreground">
              {comment.creator_profiles?.first_name} {comment.creator_profiles?.last_name}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(comment.created_at).toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{comment.text}</p>
          <div className="flex space-x-2 mt-3">
            {user && user.id === comment.user_id && (
              <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs text-destructive hover:bg-destructive/10" onClick={() => handleDeleteComment(comment.id)}>
                Delete
              </Button>
            )}
            {user && (
              <Button variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs text-primary hover:bg-primary/10" onClick={() => { setReplyingToCommentId(comment.id); setReplyText(''); }}>
                Reply
              </Button>
            )}
          </div>
          {comment.replies && comment.replies.length > 0 && (
            <div className="ml-6 mt-4 space-y-4"> {/* Removed border-l for a cleaner look */}
              {renderComments(comment.replies)}
            </div>
          )}
        </div>
      </div>
    ));
  };

  if (isLoading) {
    return <div className="text-center text-muted-foreground py-10">Loading video...</div>;
  }

  if (error) {
    if (video && video.status === 'blocked') {
      const isOwner = user && user.id === video.user_id;
      return (
        <div className="container mx-auto p-4 max-w-4xl text-center">
          <div className="bg-card p-8 rounded-lg shadow-lg border border-border">
            <h1 className="text-4xl font-bold mb-4 text-foreground">{video.title}</h1>
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
            {isOwner && (
              <p className="text-sm text-muted-foreground">
                Please review our content guidelines or contact support for more information.
              </p>
            )}
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
    <div className="container mx-auto py-6 px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        {/* Video Player */}
        <div className="bg-black rounded-lg overflow-hidden shadow-xl border border-border">
          <CustomVideoPlayer
            videoUrl={video.video_url}
            title={video.title}
            thumbnailUrl={video.thumbnail_url}
            onProgressThresholdMet={handleVideoProgressThresholdMet}
            videoId={video.id}
          />
        </div>

        {/* Video Details */}
        <div className="mt-6 p-6 bg-card rounded-lg shadow-lg border border-border">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-3 leading-tight text-foreground">{video.title}</h1>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-muted-foreground text-sm mb-4">
            <div className="flex items-center space-x-4 text-muted-foreground mb-2 sm:mb-0">
              <p className="text-base">{video.video_stats?.views || 0} views</p>
              <p className="text-base">•</p>
              <p className="text-base">{new Date(video.created_at).toLocaleDateString()}</p>
              {video.status === 'draft' && <Badge variant="secondary" className="ml-2 bg-yellow-600 text-white">Draft</Badge>}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between py-4 border-t border-b border-border my-4">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={handleLikeToggle} className={`flex items-center gap-2 px-3 py-2 rounded-full ${isLiked ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'} transition-colors`}>
                <ThumbsUp className="h-5 w-5" fill={isLiked ? 'currentColor' : 'none'} />
                <span className="text-sm font-medium">{likes}</span>
              </Button>
              <Button variant="ghost" onClick={handleShareVideo} className="flex items-center gap-2 px-3 py-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
                <Share2 className="h-5 w-5" />
                <span className="text-sm font-medium">Share</span>
              </Button>
              {isOwner && (
                <>
                  <Button variant="ghost" onClick={() => setIsEditDialogOpen(true)} className="flex items-center gap-2 px-3 py-2 rounded-full text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-colors">
                    <Edit className="h-5 w-5" />
                    <span className="text-sm font-medium">Edit</span>
                  </Button>
                  <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(true)} className="flex items-center gap-2 px-3 py-2 rounded-full text-destructive hover:bg-destructive/10 transition-colors">
                    <Trash2 className="h-5 w-5" />
                    <span className="text-sm font-medium">Delete</span>
                  </Button>
                </>
              )}
              {!isOwner && user && (
                <Button variant="ghost" onClick={() => toast.info('Reporting feature coming soon!')} className="flex items-center gap-2 px-3 py-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
                  <Flag className="h-5 w-5" />
                  <span className="text-sm font-medium">Report</span>
                </Button>
              )}
            </div>
          </div>

          {/* Description and Tags */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 mb-4">
              {video.tags?.map((tag, index) => (
                <Badge key={index} variant="secondary" className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded-full">{tag}</Badge>
              ))}
            </div>
            <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap">{video.description}</p>
          </div>

          {/* Uploader Profile */}
          <div className="flex items-center space-x-4 py-4 border-t border-border">
            <Link to={`/profile/${video.user_id}`} className="flex items-center space-x-3 group">
              <Avatar className="h-12 w-12 border-2 border-primary/50">
                <AvatarImage src={video.creator_profiles?.avatar_url || undefined} alt={video.creator_profiles?.first_name || 'Uploader'} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  <LucideUser className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                  {video.creator_profiles ? `${video.creator_profiles.first_name || ''} ${video.creator_profiles.last_name || ''}`.trim() || 'Unknown Creator' : 'Loading Creator...'}
                </p>
                <p className="text-sm text-muted-foreground">Uploader</p>
              </div>
            </Link>
            {!isOwner && user && uploaderProfile && (
              <Button
                variant={isFollowingUploader ? "secondary" : "default"}
                onClick={handleFollowToggle}
                disabled={isSubscribing}
                className="ml-auto px-4 py-2 rounded-full text-sm font-medium transition-colors"
              >
                {isSubscribing ? '...' : isFollowingUploader ? <><Check className="mr-2 h-4 w-4" /> Joined Crew</> : <><Plus className="mr-2 h-4 w-4" /> Join Crew</>}
              </Button>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-8 p-6 bg-card rounded-lg shadow-lg border border-border">
          <h2 className="text-2xl font-bold mb-6 text-foreground">Comments ({comments.length})</h2>
          {user && (
            <div className="mb-8 p-4 bg-background rounded-lg border border-border shadow-sm">
              <Textarea
                placeholder="Add a comment..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                rows={3}
                className="mb-3 bg-input text-foreground border-border focus-visible:ring-primary"
              />
              <Button onClick={() => handlePostComment()} disabled={!newCommentText.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Post Comment
              </Button>
            </div>
          )}
          <div className="space-y-6">
            {renderComments(comments)}
          </div>
        </div>
      </div>

      {/* Related Videos Section */}
      <div className="lg:col-span-1">
        <h2 className="text-2xl font-bold mb-4 text-foreground">Related Videos</h2>
        <div className="space-y-4">
          <div className="bg-card p-4 rounded-lg border border-border text-muted-foreground shadow-sm">
            More videos coming soon!
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-destructive">Are you absolutely sure?</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              This action cannot be undone. This will permanently delete your video and all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="text-foreground border-border hover:bg-secondary/50">Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteVideo}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Video Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-primary">Edit Video Details</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Make changes to your video's title, description, and tags here.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editTitle" className="text-right text-foreground">
                Title
              </Label>
              <Input
                id="editTitle"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="col-span-3 bg-input text-foreground border-border focus-visible:ring-primary"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editDescription" className="text-right text-foreground">
                Description
              </Label>
              <Textarea
                id="editDescription"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="col-span-3 bg-input text-foreground border-border focus-visible:ring-primary"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editTags" className="text-right text-foreground">
                Tags
              </Label>
              <Input
                id="editTags"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="comma, separated, tags"
                className="col-span-3 bg-input text-foreground border-border focus-visible:ring-primary"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="text-foreground border-border hover:bg-secondary/50">Cancel</Button>
            <Button onClick={handleEditVideo} disabled={isSubscribing} className="bg-primary text-primary-foreground hover:bg-primary/90">Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={!!replyingToCommentId} onOpenChange={() => setReplyingToCommentId(null)}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-primary">Reply to Comment</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Replying to a comment.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="Write your reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={4}
              className="bg-input text-foreground border-border focus-visible:ring-primary"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyingToCommentId(null)} className="text-foreground border-border hover:bg-secondary/50">Cancel</Button>
            <Button onClick={() => handlePostComment(replyingToCommentId)} disabled={!replyText.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90">Post Reply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WatchVideo;