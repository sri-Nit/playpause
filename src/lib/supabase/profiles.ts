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

// The updateProfileMessagePreference function has been removed as 'message_preference'
// is no longer a column in the 'profiles' table according to the provided schema.
// If this functionality is still desired, a new column would need to be added to the database.