import { supabase } from '@/integrations/supabase/client';
import { Conversation, Message } from './types';
import { getProfileById } from './profiles'; // Import getProfileById from its new location

/**
 * Gets an existing conversation between two users, or creates a new one if it doesn't exist.
 * Handles message requests based on the recipient's message_preference.
 */
export const getOrCreateConversation = async (
  currentUserId: string,
  recipientId: string,
): Promise<Conversation | null> => {
  try {
    // Ensure user1_id is always the smaller UUID for consistent lookup
    const [user1_id, user2_id] = [currentUserId, recipientId].sort();

    // Try to find an existing conversation
    const { data: existingConversation, error: fetchError } = await supabase
      .from('conversations')
      .select('*, user1_id(id, first_name, last_name, avatar_url), user2_id(id, first_name, last_name, avatar_url)')
      .eq('user1_id', user1_id)
      .eq('user2_id', user2_id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw new Error(fetchError.message);
    }

    if (existingConversation) {
      return existingConversation as Conversation;
    }

    // If no existing conversation, create a new one
    const recipientProfile = await getProfileById(recipientId); // Corrected call
    if (!recipientProfile) {
      console.error(`Recipient profile not found for ID: ${recipientId}`);
      throw new Error('Recipient profile not found.');
    }

    let conversationStatus: 'pending' | 'accepted' | 'rejected' | 'blocked' = 'accepted';

    // Determine initial status based on recipient's message_preference
    if (recipientProfile.message_preference === 'blocked') {
      throw new Error('This user does not accept messages.');
    } else if (recipientProfile.message_preference === 'requests') {
      conversationStatus = 'pending';
    }
    // If 'open', status remains 'accepted'

    const { data: newConversation, error: insertError } = await supabase
      .from('conversations')
      .insert({ user1_id, user2_id, status: conversationStatus })
      .select('*, user1_id(id, first_name, last_name, avatar_url), user2_id(id, first_name, last_name, avatar_url)')
      .single();

    if (insertError) {
      throw new Error(insertError.message);
    }

    return newConversation as Conversation;
  } catch (error) {
    console.error('Error getting or creating conversation:', error);
    throw error;
  }
};

/**
 * Gets all conversations for a given user, ordered by last message time.
 */
export const getConversationsForUser = async (userId: string): Promise<Conversation[]> => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*, user1_id(id, first_name, last_name, avatar_url), user2_id(id, first_name, last_name, avatar_url)')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('last_message_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }
    return data as Conversation[];
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
};

/**
 * Gets all messages within a specific conversation, ordered by creation time.
 */
export const getMessagesInConversation = async (conversationId: string): Promise<Message[]> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:sender_id(id, first_name, last_name, avatar_url)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }
    return data as Message[];
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

/**
 * Sends a new message in a conversation.
 */
export const sendMessage = async (
  conversationId: string,
  senderId: string,
  text: string,
): Promise<Message | null> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: senderId, text })
      .select('*, sender:sender_id(id, first_name, last_name, avatar_url)')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // Update last_message_at for the conversation
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    return data as Message;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Updates the status of a conversation (e.g., 'accepted', 'rejected', 'blocked').
 */
export const updateConversationStatus = async (
  conversationId: string,
  status: 'pending' | 'accepted' | 'rejected' | 'blocked',
): Promise<Conversation | null> => {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .update({ status })
      .eq('id', conversationId)
      .select('*, user1_id(id, first_name, last_name, avatar_url), user2_id(id, first_name, last_name, avatar_url)')
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return data as Conversation;
  } catch (error) {
    console.error('Error updating conversation status:', error);
    throw error;
  }
};