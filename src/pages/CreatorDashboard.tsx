import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, VideoIcon, MessageCircle, BarChart, Trash2, Reply, Eye, Heart } from 'lucide-react';
import { toast } from 'sonner';
import {
  getCreatorVideos,
  getVideoAnalytics, // Now takes an array of video IDs
  getCommentsForCreatorVideos,
  deleteComment,
  addComment,
  Video,
  Comment,
} from '@/lib/video-store';
import CreatorVideoCard from '@/components/CreatorVideoCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as LucideUser } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface CommentWithVideoTitle extends Comment {
  videos: { title: string };
}

// Updated VideoWithAnalytics to reflect the new Video type structure
interface VideoWithAnalytics extends Video {
  likesCount: number;
  commentsCount: number;
}

const CreatorDashboard = () => {
  const { user, isLoading: isSessionLoading } = useSession();
  const navigate = useNavigate();
  const [creatorVideos, setCreatorVideos] = useState<VideoWithAnalytics[]>([]);
  const [allComments, setAllComments] = useState<CommentWithVideoTitle[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('videos');
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const fetchCreatorData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const videos = await getCreatorVideos(user.id);
      const videoIds = videos.map(v => v.id);
      const analyticsMap = await getVideoAnalytics(videoIds);

      let viewsCount = 0;
      let likesCount = 0;
      let commentsCount = 0;

      const videosWithAnalytics: VideoWithAnalytics[] = videos.map(video => {
        const analytics = analyticsMap[video.id] || { likes: 0, comments: 0 };
        viewsCount += video.video_stats?.[0]?.views || 0; // Correctly access views from embedded video_stats
        likesCount += analytics.likes;
        commentsCount += analytics.comments;
        return { ...video, likesCount: analytics.likes, commentsCount: analytics.comments };
      });

      setCreatorVideos(videosWithAnalytics);
      setTotalViews(viewsCount);
      setTotalLikes(likesCount);
      setTotalComments(commentsCount);

      const comments = await getCommentsForCreatorVideos(user.id);
      setAllComments(comments as CommentWithVideoTitle[]);

    } catch (error: any) {
      toast.error(`Failed to load dashboard data: ${error.message}`);
      console.error('Creator dashboard data fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isSessionLoading && !user) {
      navigate('/auth');
      toast.error('You must be logged in to access the Creator Dashboard.');
    } else if (user) {
      fetchCreatorData();
    }
  }, [user, isSessionLoading, navigate, fetchCreatorData]);

  const handleVideoUpdated = () => {
    fetchCreatorData(); // Refresh data after a video is updated
  };

  const handleVideoDeleted = () => {
    fetchCreatorData(); // Refresh data after a video is deleted
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    const loadingToastId = toast.loading('Deleting comment...');
    try {
      await deleteComment(commentId);
      toast.success('Comment deleted!', { id: loadingToastId });
      fetchCreatorData(); // Refresh comments
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
      fetchCreatorData(); // Refresh comments
    } catch (error: any) {
      toast.error(`Failed to post reply: ${error.message}`, { id: loadingToastId });
      console.error(error);
    }
  };

  if (isSessionLoading || isLoading) {
    return <div className="text-center text-muted-foreground py-10">Loading creator dashboard...</div>;
  }

  if (!user) {
    return null; // Should be redirected by useEffect
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
                  initialLikes={video.likesCount}
                  initialComments={video.commentsCount}
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
                      <AvatarImage src={comment.creator_profiles?.avatar_url || undefined} alt={comment.creator_profiles?.first_name || 'Commenter'} />
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