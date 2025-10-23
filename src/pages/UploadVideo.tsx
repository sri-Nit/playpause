import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addVideoMetadata } from '@/lib/video-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client'; // Import supabase client
import { v4 as uuidv4 } from 'uuid'; // For generating unique file names

const formSchema = z.object({
  title: z.string().min(2, { message: 'Title must be at least 2 characters.' }).max(100, { message: 'Title must not exceed 100 characters.' }),
  description: z.string().max(500, { message: 'Description must not exceed 500 characters.' }).optional(),
  videoFile: z.any().refine((file) => file?.length > 0, 'Video file is required.'),
  thumbnailFile: z.any().refine((file) => file?.length > 0, 'Thumbnail file is required.'),
});

const UploadVideo = () => {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsUploading(true);
    const loadingToastId = toast.loading('Uploading video...');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to upload a video.', { id: loadingToastId });
        setIsUploading(false);
        return;
      }

      const videoFile = values.videoFile[0];
      const thumbnailFile = values.thumbnailFile[0];

      // Generate unique file names
      const videoFileName = `${uuidv4()}-${videoFile.name}`;
      const thumbnailFileName = `${uuidv4()}-${thumbnailFile.name}`;

      // Upload video file to Supabase Storage
      const { data: videoUploadData, error: videoUploadError } = await supabase.storage
        .from('videos') // Assuming you have a bucket named 'videos'
        .upload(videoFileName, videoFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (videoUploadError) {
        throw new Error(`Video upload failed: ${videoUploadError.message}`);
      }

      // Get public URL for the video
      const { data: videoUrlData } = supabase.storage
        .from('videos')
        .getPublicUrl(videoUploadData.path);
      const videoUrl = videoUrlData.publicUrl;

      // Upload thumbnail file to Supabase Storage
      const { data: thumbnailUploadData, error: thumbnailUploadError } = await supabase.storage
        .from('thumbnails') // Assuming you have a bucket named 'thumbnails'
        .upload(thumbnailFileName, thumbnailFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (thumbnailUploadError) {
        throw new Error(`Thumbnail upload failed: ${thumbnailUploadError.message}`);
      }

      // Get public URL for the thumbnail
      const { data: thumbnailUrlData } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(thumbnailUploadData.path);
      const thumbnailUrl = thumbnailUrlData.publicUrl;

      // Add video metadata to Supabase database
      const addedVideo = await addVideoMetadata({
        title: values.title,
        description: values.description,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
      }, user.id);

      if (addedVideo) {
        toast.success('Video uploaded successfully!', { id: loadingToastId });
        form.reset();
        navigate('/'); // Redirect to home page after upload
      } else {
        throw new Error('Failed to save video metadata.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload video.', { id: loadingToastId });
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Upload Your Video</h1>
      <div className="max-w-2xl mx-auto bg-card p-8 rounded-lg shadow-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Video Title</FormLabel>
                  <FormControl>
                    <Input placeholder="My Awesome Video" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Tell us about your video..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="videoFile"
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>Video File</FormLabel>
                  <FormControl>
                    <Input
                      {...fieldProps}
                      type="file"
                      accept="video/*"
                      onChange={(event) => onChange(event.target.files)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="thumbnailFile"
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>Thumbnail File</FormLabel>
                  <FormControl>
                    <Input
                      {...fieldProps}
                      type="file"
                      accept="image/*"
                      onChange={(event) => onChange(event.target.files)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Upload Video'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default UploadVideo;