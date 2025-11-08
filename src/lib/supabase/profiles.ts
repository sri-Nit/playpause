import { supabase } from '@/integrations/supabase/client';
import { Profile } from './types';

// Function to get a user profile by ID
export const getProfileById = async (id: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url') // Removed message_preference
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

// Function to update a user's message preference. (Removed as messaging is removed)
// export const updateProfileMessagePreference = async (
//   userId: string,
//   preference: 'open' | 'requests' | 'blocked',
// ): Promise<Profile | null> => {
//   try {
//     const { data, error } = await supabase
//       .from('profiles')
//       .update({ message_preference: preference })
//       .eq('id', userId)
//       .select('id, first_name, last_name, avatar_url, message_preference')
//       .single();

//     if (error) {
//       throw new Error(error.message);
//     }
//     return data as Profile;
//   } catch (error) {
//     console.error('Error updating message preference:', error);
//     throw error;
//   }
// };