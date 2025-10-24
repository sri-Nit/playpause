import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getVideoById, getProfileById, incrementVideoView, Video, Profile, getLikesForVideo, addLike, removeLike, getCommentsForVideo, addComment, deleteComment, deleteVideo } from '@/lib/video-store';
import VideoPlayer from '@/components/VideoPlayer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Trash2, Edit, User as LucideUser } from 'lucide-react';
import { useSession } from '@/components/SessionContextProvider';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CommentWithProfile extends Comment {
  profiles: Profile;
}

const WatchVideo = () => {
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

  useEffect(() => {
    const fetchVideoDetails = async () => {
      if (!id) {
        setError('Video ID is missing.');
        setIsLoading(false);
        return;
      }

      try {
        const fetchedVideo = await getVideoById(id);
        if (fetchedVideo) {
          setVideo(fetchedVideo);
          
          // Increment view count
          await incrementVideoView(id);

          const fetchedProfile = await getProfileById(fetchedVideo.user_id);
          setUploaderProfile(fetchedProfile);

          const fetchedLikes = await getLikesForVideo(id);
          setLikes(fetchedLikes.length);
          if (user) {
            setIsLiked(fetchedLikes.some(like => like.user_id === user.id));
          }

          const fetchedComments = await getCommentsForVideo(id);
          setComments(fetchedComments as CommentWithProfile[]);

          setEditTitle(fetchedVideo.title);
          setEditDescription(fetchedVideo.description || '');
        } else {
          setError('Video not found.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch video details.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (!isSessionLoading) {
      fetchVideoDetails();
    }
  }, [id, user, isSessionLoading]);

  const handleLikeToggle = async () => {
    if (!user) {
      toast.error('You must be logged in to like a video.');
      return;
    }
    if (!id) return;

    try {
      if (isLiked) {
        await removeLike(user.id, id);
        setLikes(prev => prev - 1);
        setIsLiked(false);
        toast.success('Video unliked!');
      } else {
        await addLike(user.id, id);
        setLikes(prev => prev + 1);
        setIsLiked(true);
        toast.success('Video liked!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update like status.');
      console.error(err);
    }
  };

  const handlePostComment = async () => {
    if (!user) {
      toast.error('You must be logged in to post a comment.');
      return;
    }
    if (!id || !newCommentText.trim()) {
      toast.error('Comment cannot be empty.');
      return;
    }

    try {
      const addedComment = await addComment(id, user.id, newCommentText);
      if (addedComment) {
        // Manually add profile data for the new comment
        const userProfile = await getProfileById(user.id);
        const commentWithProfile: CommentWithProfile = {
          ...addedComment,
          profiles: userProfile || { id: user.id, first_name: null, last_name: null, avatar_url: null },
        };
        setComments(prev => [...prev, commentWithProfile]);
        setNewCommentText('');
        toast.success('Comment posted!');
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
      setComments(prev => prev.filter(comment => comment.id !== commentId));
      toast.success('Comment deleted!');
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

    try {
      const updatedVideo = await updateVideoMetadata(id, {
        title: editTitle,
        description: editDescription,
      });
      if (updatedVideo) {
        setVideo(updatedVideo);
        toast.success('Video updated successfully!');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update video.');
      console.error(err);
    } finally {
      setIsEditDialogOpen(false);
    }
  };

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

  return (
    <div className="container mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <VideoPlayer videoUrl={video.video_url} title={video.title} />
        <h1 className="text-3xl font-bold mt-4 mb-2">{video.title}</h1>
        <div className="flex items-center justify-between text-muted-foreground text-sm mb-4">
          <div className="flex items-center space-x-4">
            <p>{video.views} views</p>
            <p>{new Date(video.created_at).toLocaleDateString()}</p>
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
          </div>
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
          <div>
            <Link to={`/profile/${uploaderProfile?.id}`} className="font-semibold hover:underline">
              {uploaderProfile?.first_name} {uploaderProfile?.last_name}
            </Link>
            <p className="text-sm text-muted-foreground">Uploader</p>
          </div>
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
              <Button onClick={handlePostComment} disabled={!newCommentText.trim()}>
                Post Comment
              </Button>
            </div>
          )}
          <div className="space-y-4">
            {comments.map((comment) => (
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
                  {user && user.id === comment.user_id && (
                    <Button variant="ghost" size="sm" className="h-auto px-0 py-1 text-xs text-red-500 hover:text-red-700" onClick={() => handleDeleteComment(comment.id)}>
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            ))}
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
              Make changes to your video's title and description here.
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditVideo}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WatchVideo;