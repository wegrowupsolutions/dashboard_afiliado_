
import React from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import ConversationList from './ConversationList';
import ChatArea from './ChatArea';
import ClientInfoPanel from './ClientInfoPanel';
import { Conversation, ChatMessage } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

export interface ChatConversation {
  id: string
  remotejid: string
  nome: string
  timestamp: string
  lastMessage: string
  unreadCount: number
  isPaused: boolean
  pauseReason?: string
  pauseExpiresAt?: string
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  remotejid: string
  nome: string
  message: string
  timestamp: string
  isFromUser: boolean
  conversationId: string
}

interface ChatLayoutProps {
  conversations: ChatConversation[];
  selectedChat: string | null;
  setSelectedChat: (id: string) => void;
  isLoading: Record<string, boolean>;
  openPauseDialog: (phoneNumber: string, e: React.MouseEvent) => void;
  resumeConversation: (phoneNumber: string, e: React.MouseEvent) => void;
  loading: boolean;
  messages: ChatMessage[];
  handleNewMessage: (message: ChatMessage) => void;
  selectedConversation?: ChatConversation;
  markConversationRead: (sessionId: string) => void;
  onRefresh: () => void;
  error: string | null;
}

const ChatLayout = ({
  conversations,
  selectedChat,
  setSelectedChat,
  isLoading,
  openPauseDialog,
  resumeConversation,
  loading,
  messages,
  handleNewMessage,
  selectedConversation,
  markConversationRead,
  onRefresh,
  error
}: ChatLayoutProps) => {
  
  const handleSelectChat = (id: string) => {
    console.log(`Selecting chat with ID: ${id}`);
    setSelectedChat(id);
    markConversationRead(id);
  };
  
  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      <ResizablePanel defaultSize={25} minSize={20} maxSize={30} className="bg-white dark:bg-gray-800">
        <ConversationList 
          conversations={conversations} 
          selectedChat={selectedChat}
          setSelectedChat={handleSelectChat}
          isLoading={isLoading}
          openPauseDialog={openPauseDialog}
          resumeConversation={resumeConversation}
          onRefresh={onRefresh}
          error={error}
        />
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={50} minSize={40} className="bg-gray-50 dark:bg-gray-900 flex flex-col">
        <ChatArea 
          selectedChat={selectedChat}
          selectedConversation={selectedConversation}
          messages={messages}
          loading={loading}
        />
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={25} minSize={20} maxSize={30} className="bg-white dark:bg-gray-800">
        <ClientInfoPanel 
          selectedChat={selectedChat}
          selectedConversation={selectedConversation}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default ChatLayout;
