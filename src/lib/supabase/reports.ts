import { supabase } from '@/integrations/supabase/client';
import { Report } from './types';

// Function to get total reports
export const getTotalReports = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error fetching total reports:', error);
      throw new Error(error.message);
    }
    return count || 0;
  } catch (error) {
    console.error('Unexpected error fetching total reports:', error);
    throw error;
  }
};

// Function to get all reports
export const getAllReports = async (): Promise<Report[]> => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all reports:', error);
      throw new Error(error.message);
    }
    return data as Report[];
  } catch (error) {
    console.error('Unexpected error fetching all reports:', error);
    throw error;
  }
};

// Function to resolve a report
export const resolveReport = async (reportId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('reports')
      .update({ resolved: true })
      .eq('id', reportId);

    if (error) {
      console.error('Error resolving report:', error);
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Unexpected error resolving report:', error);
    throw error;
  }
};

// Function to delete a report
export const deleteReport = async (reportId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportId);

    if (error) {
      console.error('Error deleting report:', error);
      throw new Error(error.message);
    }
  } catch (error) {
    console.error('Unexpected error deleting report:', error);
    throw error;
  }
};

// Function to add a report
export const addReport = async (reporterId: string, videoId: string, reason: string): Promise<Report | null> => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .insert({ reporter_id: reporterId, video_id: videoId, reason })
      .select()
      .single();

    if (error) {
      console.error('Error adding report:', error);
      throw new Error(error.message);
    }
    return data as Report;
  } catch (error) {
    console.error('Unexpected error adding report:', error);
    throw error;
  }
};