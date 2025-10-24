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
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { useSession } from '@/components/SessionContextProvider';

const formSchema = z.object({
  title: z.string().min(2, { message: 'Title must be at least 2 characters.' }).max(100, { message: 'Title must not exceed 100 characters.' }),
  description: z.string().max(500, { message: 'Description must not exceed 500 characters.' }).optional(),
  videoFile: z.any().refine((file) => file?.length > 0, 'Video file is required.'),
  thumbnailFile: z.any().refine((file) => file?.length > 0, 'Thumbnail file is required.'),
  tags: z.string().optional(), // New field for tags
});

const UploadVideo = () => {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useSession();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      tags: '', // Default value for tags
    },
  });

  const uploadFile = async (file: File, bucket: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (error) {
        if (error.message.includes('permission')) {
          throw new Error(`Permission denied for ${bucket}. Please check bucket policies.`);
        }
        throw new Error(`Failed to upload ${bucket}: ${error.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      throw error;
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast.error('You must be logged in to upload a video.');
      return;
    }

    setIsUploading(true);
    const loadingToastId = toast.loading('Uploading video...');

    try {
      const videoFile = values.videoFile[0];
      const thumbnailFile = values.thumbnailFile[0];

      if (!videoFile.type.startsWith('video/')) {
        throw new Error('Please select a valid video file.');
      }

      if (!thumbnailFile.type.startsWith('image/')) {
        throw new Error('Please select a valid image file for thumbnail.');
      }

      toast.loading('Uploading video file...', { id: loadingToastId });
      const videoUrl = await uploadFile(videoFile, 'videos');
      
      toast.loading('Uploading thumbnail...', { id: loadingToastId });
      const thumbnailUrl = await uploadFile(thumbnailFile, 'thumbnails');

      const videoTags = values.tags ? values.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];

      toast.loading('Saving video metadata...', { id: loadingToastId });
      const addedVideo = await addVideoMetadata({
        title: values.title,
        description: values.description,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        tags: videoTags, // Pass tags to the metadata function
      }, user.id);

      if (addedVideo) {
        toast.success('Video uploaded successfully!', { id: loadingToastId });
        form.reset();
        navigate('/');
      } else {
        throw new Error('Failed to save video metadata.');
      }
    } catch (error: any) {
      let errorMessage = error.message || 'Failed to upload video.';
      
      if (errorMessage.includes('permission')) {
        errorMessage += ' Please ensure storage bucket policies are correctly configured.';
      }
      
      toast.error(errorMessage, { id: loadingToastId });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Upload Your Video</h1>
      <div className="max-w-2xl mx-auto bg-card p-6 rounded-lg shadow-md">
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
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (comma-separated)</FormLabel>
                  <FormControl>
                    <Input placeholder="gaming, tutorial, vlog" {...field} />
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
        
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h3 className="font-medium text-yellow-800">Troubleshooting Tips</h3>
          <ul className="mt-2 text-sm text-yellow-700 list-disc pl-5 space-y-1">
            <li>Ensure both "videos" and "thumbnails" storage buckets exist</li>
            <li>Check that bucket policies allow authenticated uploads</li>
            <li>Verify that public access is enabled for both buckets</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UploadVideo;