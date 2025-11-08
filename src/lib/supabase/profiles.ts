import { supabase } from '@/integrations/supabase/client';
import { Profile } from './types';

// Function to get a user profile by ID
export const getProfileById = async (id: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, created_at') // Updated to select new fields
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
      throw new Error(error.message);
    }
    return data as Profile | null;
  } catch (error) {
    console.error('Unexpected error fetching profile:', error);
    throw error;
  }
};

// Function to update a user's message preference.
// NOTE: message_preference was removed from the new schema. This function will be removed or adapted later if a similar feature is requested.
// For now, I'm commenting it out as it references a non-existent column.
/*
export const updateProfileMessagePreference = async (
  userId: string,
  preference: 'open' | 'requests' | 'blocked',
): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ message_preference: preference })
      .eq('id', userId)
      .select('id, username, display_name, created_at') // Updated to select new fields
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return data as Profile;
  } catch (error) {
    console.error('Error updating message preference:', error);
    throw error;
  }
};
*/