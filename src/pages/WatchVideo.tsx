import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  incrementVideoView,
  addLike,
  removeLike,
  addComment,
  deleteComment,
  deleteVideo,
  isFollowing,
  addSubscription,
  removeSubscription,
  updateVideoMetadata,
  Video,
  Profile,
  Comment,
} from '@/lib/video-store';
import {
  useVideoById,
  useProfileById,
  useLikesForVideo,
  useCommentsForVideo,
} from '@/hooks/use-video-data'; // Import new hooks
import VideoPlayer from '@/components/VideoPlayer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Trash2, Edit, User as LucideUser, Plus, Check, Flag } from 'lucide-react';
import { useSession } from '@/components/SessionContextProvider';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useQueryClient } from '@tanstack/react-query'; // Import useQueryClient

interface CommentWithProfile extends Comment {
  profiles: Profile;
  replies?: CommentWithProfile[]; // For nested replies
}

const WatchVideo = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading: isSessionLoading } = useSession();
  const queryClient = useQueryClient(); // Initialize query client

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTags, setEditTags] = useState('');
  const [isFollowingUploader, setIsFollowingUploader] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Fetch video details using react-query
  const { data: video, isLoading: isVideoLoading, error: videoError } = useVideoById(id || '');
  // Fetch uploader profile using react-query
  const { data: uploaderProfile, isLoading: isProfileLoading, error: profileError } = useProfileById(video?.user_id || '');
  // Fetch likes for the video using react-query
  const { data: fetchedLikes = [], isLoading: isLikesLoading, error: likesError, refetch: refetchLikes } = useLikesForVideo(id || '');
  // Fetch comments for the video using react-query
  const { data: fetchedComments = [], isLoading: isCommentsLoading, error: commentsError, refetch: refetchComments } = useCommentsForVideo(id || '');

  const likes = fetchedLikes.length;
  const isLiked = user ? fetchedLikes.some(like => like.user_id === user.id) : false;

  // Organize comments into a tree structure for replies
  const comments: CommentWithProfile[] = React.useMemo(() => {
    const commentMap = new Map<string, CommentWithProfile>();
    fetchedComments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    const rootComments: CommentWithProfile[] = [];
    fetchedComments.forEach(comment => {
      if (comment.parent_comment_id && commentMap.has(comment.parent_comment_id)) {
        commentMap.get(comment.parent_comment_id)?.replies?.push(commentMap.get(comment.id)!);
      } else {
        rootComments.push(commentMap.get(comment.id)!);
      }
    });
    return rootComments;
  }, [fetchedComments]);

  // Effect to handle initial video view increment and subscription status
  useEffect(() => {
    const handleInitialLoad = async () => {
      if (!video || isSessionLoading) return;

      // Only increment view count for published videos
      if (video.status === 'published') {
        await incrementVideoView(video.id);
        queryClient.invalidateQueries({ queryKey: ['video', video.id] }); // Invalidate to show updated views
        queryClient.invalidateQueries({ queryKey: ['creatorVideos', video.user_id] }); // Invalidate creator's dashboard views
      }

      if (user && video.user_id !== user.id) {
        const followingStatus = await isFollowing(user.id, video.user_id);
        setIsFollowingUploader(followingStatus);
      }
    };

    handleInitialLoad();
  }, [video, user, isSessionLoading, queryClient]); // Removed id from dependencies as video object already contains it

  // Update edit form fields when video data changes
  useEffect(() => {
    if (video) {
      setEditTitle(video.title);
      setEditDescription(video.description || '');
      setEditTags(video.tags?.join(', ') || '');
    }
  }, [video]);

  const handleLikeToggle = async () => {
    if (!user) {
      toast.error('You must be logged in to like a video.');
      return;
    }
    if (!id) return;

    try {
      if (isLiked) {
        await removeLike(user.id, id);
        toast.success('Video unliked!');
      } else {
        await addLike(user.id, id);
        toast.success('Video liked!');
      }
      refetchLikes(); // Refetch likes to update UI
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
      await addComment(id, user.id, textToPost, parentCommentId);
      toast.success(parentCommentId ? 'Reply posted!' : 'Comment posted!');
      setNewCommentText('');
      setReplyText('');
      setReplyingToCommentId(null);
      refetchComments(); // Refetch comments to update the tree structure
      queryClient.invalidateQueries({ queryKey: ['creatorComments', video?.user_id] }); // Invalidate creator's dashboard comments
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
      refetchComments(); // Refetch comments to update the tree structure
      queryClient.invalidateQueries({ queryKey: ['creatorComments', video?.user_id] }); // Invalidate creator's dashboard comments
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
      queryClient.invalidateQueries({ queryKey: ['videos'] }); // Invalidate all videos
      queryClient.invalidateQueries({ queryKey: ['creatorVideos', user.id] }); // Invalidate creator's videos
      navigate('/'); // Redirect to home page after deletion
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

    setIsSubscribing(true); // Using this state for general loading during edit
    const loadingToastId = toast.loading('Updating video details...');

    try {
      const updatedTags = editTags ? editTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];
      await updateVideoMetadata(id, {
        title: editTitle,
        description: editDescription,
        tags: updatedTags,
      });
      toast.success('Video updated successfully!', { id: loadingToastId });
      queryClient.invalidateQueries({ queryKey: ['video', id] }); // Invalidate specific video
      queryClient.invalidateQueries({ queryKey: ['creatorVideos', user.id] }); // Invalidate creator's videos
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
      toast.error(err.message || 'Failed to update subscription status.');
      console.error(err);
    } finally {
      setIsSubscribing(false);
    }
  };

  const renderComments = (commentList: CommentWithProfile[]) => (
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
    ))
  );

  const isLoading = isVideoLoading || isProfileLoading || isLikesLoading || isCommentsLoading || isSessionLoading;
  const hasError = videoError || profileError || likesError || commentsError;

  if (isLoading) {
    return <div className="text-center text-muted-foreground">Loading video...</div>;
  }

  if (hasError) {
    return <div className="text-center text-destructive-foreground bg-destructive p-4 rounded-md">Error: {hasError.message}</div>;
  }

  if (!video) {
    return <div className="text-center text-muted-foreground">Video not found.</div>;
  }

  const isOwner = user && user.id === video.user_id;

  return (
    <div className="container mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <VideoPlayer videoUrl={video.video_url} title={video.title} />
        <h1 className="text-3xl font-bold mt-4 mb-2">{video.title}</h1>
        <div className="flex items-center justify-between text-muted-foreground text-sm mb-4">
          <div className="flex items-center space-x-4">
            <p>{video.views} views</p>
            <p>{new Date(video.created_at).toLocaleDateString()}</p>
            {video.status === 'draft' && <Badge variant="secondary">Draft</Badge>}
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={handleLikeToggle} className={isLiked ? 'text-red-500' : ''}>
              <Heart className="h-5 w-5" fill={isLiked ? 'currentColor' : 'none'} />
            </Button>
            <span>{likes}</span>
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
              variant={isFollowingUploader ? "secondary" : "default"} 
              onClick={handleFollowToggle} 
              disabled={isSubscribing}
            >
              {isSubscribing ? '...' : isFollowingUploader ? <><Check className="mr-2 h-4 w-4" /> Following</> : <><Plus className="mr-2 h-4 w-4" /> Follow</>}
            </Button>
          )}
        </div>

        {/* Comments Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">{comments.length} Comments</h2>
          {user && (
            <div className="mb-6">
              <Textarea
                placeholder="Add a comment..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                className="mb-2"
              />
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

      <div className="lg:col-span-1">
        {/* Related Videos (Placeholder) */}
        <h2 className="text-2xl font-bold mb-4">Related Videos</h2>
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-md text-muted-foreground">
            More videos coming soon!
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
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

      {/* Edit Video Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Video Details</DialogTitle>
            <DialogDescription>
              Make changes to your video's title, description, and tags here.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editTitle" className="text-right">
                Title
              </Label>
              <Input
                id="editTitle"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editDescription" className="text-right">
                Description
              </Label>
              <Textarea
                id="editDescription"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editTags" className="text-right">
                Tags
              </Label>
              <Input
                id="editTags"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="comma, separated, tags"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditVideo} disabled={isSubscribing}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reply Dialog (for WatchVideo page) */}
      <Dialog open={!!replyingToCommentId} onOpenChange={() => setReplyingToCommentId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to Comment</DialogTitle>
            <DialogDescription>
              Replying to a comment.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="Write your reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={4}
            />
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