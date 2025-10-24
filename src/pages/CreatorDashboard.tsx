import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, VideoIcon, MessageCircle, BarChart, Trash2, Reply } from 'lucide-react';
import { toast } from 'sonner';
import {
  deleteComment,
  addComment,
  Video,
  Comment,
} from '@/lib/video-store';
import {
  useCreatorVideos,
  useVideoAnalytics,
  useCommentsForCreatorVideos,
} from '@/hooks/use-video-data'; // Import new hooks
import CreatorVideoCard from '@/components/CreatorVideoCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as LucideUser } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useQueryClient } from '@tanstack/react-query'; // Import useQueryClient

interface CommentWithVideoTitle extends Comment {
  videos: { title: string };
}

const CreatorDashboard = () => {
  const { user, isLoading: isSessionLoading } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient(); // Initialize query client
  const [activeTab, setActiveTab] = useState('videos');
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Fetch creator videos using react-query
  const { data: creatorVideos = [], isLoading: isVideosLoading, error: videosError } = useCreatorVideos(user?.id || '');

  // Fetch all comments for creator's videos using react-query
  const { data: allComments = [], isLoading: isCommentsLoading, error: commentsError } = useCommentsForCreatorVideos(user?.id || '');

  // Calculate total views, likes, comments from fetched data
  const totalViews = creatorVideos.reduce((sum, video) => sum + video.views, 0);
  const totalLikes = creatorVideos.reduce((sum, video) => {
    // This is a simplified approach. For accurate total likes, each video's likes need to be fetched.
    // For now, we'll assume 0 or fetch on demand if needed for overview.
    // A more robust solution would involve a separate aggregated query or a 'likes_count' column on the video table.
    return sum; // We'll update this if a better aggregated query is available.
  }, 0);
  const totalComments = allComments.length;

  // Refetch all creator data when a video is updated or deleted, or a comment is managed
  const refetchCreatorData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['creatorVideos', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['creatorComments', user?.id] });
    // Invalidate individual video analytics if needed, e.g., for likes count
    creatorVideos.forEach(video => queryClient.invalidateQueries({ queryKey: ['videoAnalytics', video.id] }));
  }, [queryClient, user?.id, creatorVideos]);

  useEffect(() => {
    if (!isSessionLoading && !user) {
      navigate('/auth');
      toast.error('You must be logged in to access the Creator Dashboard.');
    }
  }, [user, isSessionLoading, navigate]);

  const handleVideoUpdated = () => {
    refetchCreatorData(); // Refresh data after a video is updated
  };

  const handleVideoDeleted = () => {
    refetchCreatorData(); // Refresh data after a video is deleted
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    const loadingToastId = toast.loading('Deleting comment...');
    try {
      await deleteComment(commentId);
      toast.success('Comment deleted!', { id: loadingToastId });
      refetchCreatorData(); // Refresh comments
    } catch (error: any) {
      toast.error(`Failed to delete comment: ${error.message}`, { id: loadingToastId });
      console.error(error);
    }
  };

  const handleReplyToComment = async () => {
    if (!user || !replyingToCommentId || !replyText.trim()) {
      toast.error('Reply cannot be empty.');
      return;
    }

    const commentToReply = allComments.find(c => c.id === replyingToCommentId);
    if (!commentToReply) {
      toast.error('Original comment not found.');
      return;
    }

    const loadingToastId = toast.loading('Posting reply...');
    try {
      await addComment(commentToReply.video_id, user.id, replyText, replyingToCommentId);
      toast.success('Reply posted!', { id: loadingToastId });
      setReplyText('');
      setReplyingToCommentId(null);
      refetchCreatorData(); // Refresh comments
    } catch (error: any) {
      toast.error(`Failed to post reply: ${error.message}`, { id: loadingToastId });
      console.error(error);
    }
  };

  if (isSessionLoading || isVideosLoading || isCommentsLoading) {
    return <div className="text-center text-muted-foreground py-10">Loading creator dashboard...</div>;
  }

  if (!user) {
    return null; // Should be redirected by useEffect
  }

  if (videosError || commentsError) {
    return <div className="text-center text-destructive-foreground bg-destructive p-4 rounded-md">Error loading dashboard: {videosError?.message || commentsError?.message}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8 text-center">Creator Dashboard</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <BarChart className="mr-2 h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="videos">
            <VideoIcon className="mr-2 h-4 w-4" /> My Videos
          </TabsTrigger>
          <TabsTrigger value="comments">
            <MessageCircle className="mr-2 h-4 w-4" /> Comment Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalViews}</div>
                <p className="text-xs text-muted-foreground">Across all your videos</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalLikes}</div>
                <p className="text-xs text-muted-foreground">Across all your videos</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalComments}</div>
                <p className="text-xs text-muted-foreground">Across all your videos</p>
              </CardContent>
            </Card>
          </div>
          <div className="mt-8 text-center">
            <Button onClick={() => navigate('/upload')}>
              <PlusCircle className="mr-2 h-4 w-4" /> Upload New Video
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="videos" className="mt-6">
          {creatorVideos.length === 0 ? (
            <div className="text-center text-muted-foreground py-10">
              You haven't uploaded any videos yet.
              <Button onClick={() => navigate('/upload')} className="mt-4">
                <PlusCircle className="mr-2 h-4 w-4" /> Upload Your First Video
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {creatorVideos.map((video) => (
                <CreatorVideoCard
                  key={video.id}
                  video={video}
                  onVideoUpdated={handleVideoUpdated}
                  onVideoDeleted={handleVideoDeleted}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="comments" className="mt-6">
          <h2 className="text-2xl font-bold mb-4">Comments on Your Videos</h2>
          {allComments.length === 0 ? (
            <div className="text-center text-muted-foreground py-10">
              No comments on your videos yet.
            </div>
          ) : (
            <div className="space-y-6">
              {allComments.map((comment) => (
                <Card key={comment.id} className="p-4">
                  <div className="flex items-start space-x-3">
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
                      <p className="text-sm mt-1">{comment.text}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        On video: <span className="font-medium">{comment.videos?.title || 'Unknown Video'}</span>
                      </p>
                      <div className="flex space-x-2 mt-2">
                        <Button variant="ghost" size="sm" className="h-auto px-0 py-1 text-xs text-red-500 hover:text-red-700" onClick={() => handleDeleteComment(comment.id)}>
                          <Trash2 className="mr-1 h-3 w-3" /> Delete
                        </Button>
                        <Button variant="ghost" size="sm" className="h-auto px-0 py-1 text-xs text-primary hover:text-primary/80" onClick={() => { setReplyingToCommentId(comment.id); setReplyText(''); }}>
                          <Reply className="mr-1 h-3 w-3" /> Reply
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Reply Dialog */}
      <Dialog open={!!replyingToCommentId} onOpenChange={() => setReplyingToCommentId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to Comment</DialogTitle>
            <DialogDescription>
              Replying to a comment on "{allComments.find(c => c.id === replyingToCommentId)?.videos?.title || 'this video'}".
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
            <Button onClick={handleReplyToComment} disabled={!replyText.trim()}>Post Reply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreatorDashboard;