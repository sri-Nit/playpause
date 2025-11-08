import React, { useState } from 'react';
import { Video, deleteVideo, updateVideoMetadata, updateVideoStatus } from '@/lib/video-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, Eye, Heart, MessageCircle, Play, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface CreatorVideoCardProps {
  video: Video;
  initialLikes: number; // New prop for initial likes count
  initialComments: number; // New prop for initial comments count
  onVideoUpdated: () => void; // Callback to refresh video list
  onVideoDeleted: () => void; // Callback to refresh video list
}

const CreatorVideoCard: React.FC<CreatorVideoCardProps> = ({ video, initialLikes, initialComments, onVideoUpdated, onVideoDeleted }) => {
  // Use initial props for analytics, no longer fetching internally
  const [likes, setLikes] = useState(initialLikes);
  const [comments, setComments] = useState(initialComments);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(video.title);
  const [editDescription, setEditDescription] = useState(video.description || '');
  const [editTags, setEditTags] = useState(video.tags?.join(', ') || '');
  const [editStatus, setEditStatus] = useState<'draft' | 'published'>(video.status === 'draft' ? 'draft' : 'published'); // Ensure status is 'draft' or 'published'
  const [isSaving, setIsSaving] = useState(false);

  // Update local state if initial props change (e.g., after a dashboard refresh)
  React.useEffect(() => {
    setLikes(initialLikes);
    setComments(initialComments);
  }, [initialLikes, initialComments]);

  const handleDeleteVideo = async () => {
    const loadingToastId = toast.loading('Deleting video...');
    try {
      await deleteVideo(video.id);
      toast.success('Video deleted successfully!', { id: loadingToastId });
      onVideoDeleted();
    } catch (error: any) {
      toast.error(`Failed to delete video: ${error.message}`, { id: loadingToastId });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const handleUpdateVideo = async () => {
    setIsSaving(true);
    const loadingToastId = toast.loading('Updating video details...');
    try {
      const updatedTags = editTags ? editTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];
      await updateVideoMetadata(video.id, {
        title: editTitle,
        description: editDescription,
        tags: updatedTags,
        status: editStatus,
      });
      toast.success('Video updated successfully!', { id: loadingToastId });
      onVideoUpdated();
    } catch (error: any) {
      toast.error(`Failed to update video: ${error.message}`, { id: loadingToastId });
    } finally {
      setIsSaving(false);
      setIsEditDialogOpen(false);
    }
  };

  const handleStatusChange = async (newStatus: 'draft' | 'published') => {
    const loadingToastId = toast.loading(`Changing status to ${newStatus}...`);
    try {
      await updateVideoStatus(video.id, newStatus);
      toast.success(`Video status changed to ${newStatus}!`, { id: loadingToastId });
      onVideoUpdated();
    } catch (error: any) {
      toast.error(`Failed to change status: ${error.message}`, { id: loadingToastId });
    }
  };

  return (
    <Card className="flex flex-col h-full border-border bg-card transition-all duration-200 hover:scale-[1.03] hover:shadow-lg">
      <CardContent className="p-0 relative">
        <Link to={`/watch/${video.id}`}>
          <AspectRatio ratio={16 / 9}>
            <img
              src={video.thumbnail_url}
              alt={video.title}
              className="rounded-t-lg object-cover w-full h-full"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
          </AspectRatio>
        </Link>
        {video.status === 'draft' && (
          <Badge className="absolute top-2 left-2 bg-accent-b text-accent-b-foreground text-xs px-2 py-1 rounded-full">Draft</Badge>
        )}
      </CardContent>
      <CardHeader className="p-4 flex-grow">
        <CardTitle className="text-lg font-semibold line-clamp-2 text-foreground">{video.title}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {new Date(video.created_at).toLocaleDateString()}
        </CardDescription>
        <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
          <div className="flex items-center space-x-2">
            <Eye className="h-4 w-4" /> <span>{video.video_stats?.[0]?.views || 0}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Heart className="h-4 w-4" /> <span>{likes ?? 0}</span>
          </div>
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-4 w-4" /> <span>{comments ?? 0}</span>
          </div>
        </div>
      </CardHeader>
      <div className="p-4 border-t border-border flex justify-end space-x-2">
        <Button variant="outline" size="sm" onClick={() => handleStatusChange(video.status === 'published' ? 'draft' : 'published')} className="border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors duration-200">
          {video.status === 'published' ? <><Clock className="mr-2 h-4 w-4" /> Save as Draft</> : <><CheckCircle className="mr-2 h-4 w-4" /> Publish</>}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors duration-200">
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card text-foreground border-border shadow-lg">
            <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)} className="text-foreground hover:bg-secondary hover:text-foreground transition-colors duration-200">
              <Edit className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors duration-200">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-card text-foreground border-border shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">Are you absolutely sure?</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              This action cannot be undone. This will permanently delete your video and all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors duration-200">Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteVideo} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors duration-200">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Video Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card text-foreground border-border shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Video Details</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Make changes to your video's title, description, tags, and status here.
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
                className="col-span-3 bg-background text-foreground border-border"
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
                className="col-span-3 bg-background text-foreground border-border"
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
                className="col-span-3 bg-background text-foreground border-border"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="editStatus" className="text-right text-foreground">
                Status
              </Label>
              <Select value={editStatus} onValueChange={(value: 'draft' | 'published') => setEditStatus(value)}>
                <SelectTrigger id="editStatus" className="col-span-3 bg-background text-foreground border-border">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-card text-foreground border-border">
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors duration-200">Cancel</Button>
            <Button onClick={handleUpdateVideo} disabled={isSaving} className="bg-accent text-accent-foreground hover:bg-accent/90 transition-colors duration-200">
              {isSaving ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CreatorVideoCard;