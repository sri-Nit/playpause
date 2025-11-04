import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  getConversationsForUser,
  getMessagesInConversation,
  sendMessage,
  updateConversationStatus,
  Conversation,
  Message,
  Profile,
} from '@/lib/video-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as LucideUser, Send, Check, X, MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const MessagesPage = () => {
  const { user, isLoading: isSessionLoading } = useSession();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setIsLoadingConversations(true);
    try {
      const fetchedConversations = await getConversationsForUser(user.id);
      setConversations(fetchedConversations);
    } catch (error: any) {
      toast.error(`Failed to load conversations: ${error.message}`);
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [user]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    setIsLoadingMessages(true);
    try {
      const fetchedMessages = await getMessagesInConversation(conversationId);
      setMessages(fetchedMessages);
    } catch (error: any) {
      toast.error(`Failed to load messages: ${error.message}`);
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (!isSessionLoading && !user) {
      navigate('/auth');
      toast.error('You must be logged in to view messages.');
      return;
    }
    if (user) {
      fetchConversations();
    }
  }, [user, isSessionLoading, navigate, fetchConversations]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    } else {
      setMessages([]);
    }
  }, [selectedConversation, fetchMessages]);

  const handleSendMessage = async () => {
    if (!user || !selectedConversation || !newMessageText.trim()) {
      toast.error('Message cannot be empty.');
      return;
    }
    if (selectedConversation.status !== 'accepted') {
      toast.error('You can only send messages in accepted conversations.');
      return;
    }

    try {
      await sendMessage(selectedConversation.id, user.id, newMessageText);
      setNewMessageText('');
      fetchMessages(selectedConversation.id); // Refresh messages
      fetchConversations(); // Refresh conversations to update last_message_at
    } catch (error: any) {
      toast.error(`Failed to send message: ${error.message}`);
      console.error('Error sending message:', error);
    }
  };

  const handleUpdateConversationStatus = async (conversationId: string, status: 'accepted' | 'rejected' | 'blocked') => {
    try {
      await updateConversationStatus(conversationId, status);
      toast.success(`Conversation ${status}!`);
      fetchConversations(); // Refresh conversations
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(prev => prev ? { ...prev, status } : null);
      }
    } catch (error: any) {
      toast.error(`Failed to update conversation status: ${error.message}`);
      console.error('Error updating conversation status:', error);
    }
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.user1_id === user?.id ? conversation.user2 : conversation.user1;
  };

  if (isSessionLoading || isLoadingConversations) {
    return <div className="text-center text-muted-foreground py-10">Loading messages...</div>;
  }

  if (!user) {
    return null; // Should be redirected by useEffect
  }

  return (
    <div className="container mx-auto p-4 h-[calc(100vh-140px)] flex">
      {/* Conversation List */}
      <Card className="w-1/3 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquarePlus className="mr-2 h-5 w-5" /> Your Conversations
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow p-0">
          <ScrollArea className="h-full">
            {conversations.length === 0 ? (
              <p className="text-center text-muted-foreground p-4">No conversations yet.</p>
            ) : (
              conversations.map((conv) => {
                const otherUser = getOtherParticipant(conv);
                return (
                  <div
                    key={conv.id}
                    className={`flex items-center p-4 cursor-pointer hover:bg-accent ${
                      selectedConversation?.id === conv.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => setSelectedConversation(conv)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={otherUser?.avatar_url || undefined} alt={otherUser?.first_name || 'User'} />
                      <AvatarFallback>
                        <LucideUser className="h-5 w-5 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-3 flex-1">
                      <p className="font-semibold">
                        {otherUser?.first_name} {otherUser?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {conv.status === 'pending' ? 'Message Request' : 'Active Chat'}
                      </p>
                    </div>
                    {conv.status === 'pending' && (
                      <div className="flex space-x-2">
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleUpdateConversationStatus(conv.id, 'accepted'); }}>
                          <Check className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleUpdateConversationStatus(conv.id, 'rejected'); }}>
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Message Pane */}
      <Card className="w-2/3 ml-4 flex flex-col">
        {selectedConversation ? (
          <>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={getOtherParticipant(selectedConversation)?.avatar_url || undefined} alt={getOtherParticipant(selectedConversation)?.first_name || 'User'} />
                  <AvatarFallback>
                    <LucideUser className="h-5 w-5 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <CardTitle>
                  {getOtherParticipant(selectedConversation)?.first_name} {getOtherParticipant(selectedConversation)?.last_name}
                </CardTitle>
              </div>
              {selectedConversation.status === 'pending' && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Message Request:</span>
                  <Button size="sm" onClick={() => handleUpdateConversationStatus(selectedConversation.id, 'accepted')}>
                    <Check className="mr-2 h-4 w-4" /> Accept
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleUpdateConversationStatus(selectedConversation.id, 'rejected')}>
                    <X className="mr-2 h-4 w-4" /> Reject
                  </Button>
                </div>
              )}
              {selectedConversation.status === 'rejected' && (
                <span className="text-sm text-red-500">Conversation Rejected</span>
              )}
              {selectedConversation.status === 'blocked' && (
                <span className="text-sm text-red-500">Conversation Blocked</span>
              )}
            </CardHeader>
            <Separator />
            <CardContent className="flex-grow p-4 overflow-y-auto">
              <ScrollArea className="h-full pr-4">
                {isLoadingMessages ? (
                  <p className="text-center text-muted-foreground">Loading messages...</p>
                ) : messages.length === 0 ? (
                  <p className="text-center text-muted-foreground">No messages yet. Say hello!</p>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-lg ${
                            msg.sender_id === user.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <p className="text-sm">{msg.text}</p>
                          <span className="text-xs opacity-70 mt-1 block">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
            <div className="p-4 border-t flex items-center space-x-2">
              <Input
                placeholder="Type your message..."
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={selectedConversation.status !== 'accepted'}
              />
              <Button onClick={handleSendMessage} disabled={selectedConversation.status !== 'accepted' || !newMessageText.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a conversation to start chatting.
          </div>
        )}
      </Card>
    </div>
  );
};

export default MessagesPage;