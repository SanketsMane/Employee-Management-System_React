import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Users, Settings } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatWindow from '../components/chat/ChatWindow';
import { toast } from 'sonner';

const ChatPage = () => {
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState(null);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
  };

  const handleCloseChat = () => {
    setSelectedChat(null);
  };

  // Mobile layout - show sidebar or chat window
  if (isMobile) {
    return (
      <div className="h-[calc(100vh-4rem)] bg-background">
        {!selectedChat ? (
          <ChatSidebar
            selectedChat={selectedChat}
            onChatSelect={handleChatSelect}
            className="h-full border-0"
          />
        ) : (
          <div className="h-full">
            <ChatWindow
              chat={selectedChat}
              onClose={handleCloseChat}
            />
          </div>
        )}
      </div>
    );
  }

  // Desktop layout - sidebar and chat window side by side
  return (
    <div className="h-[calc(100vh-4rem)] bg-background">
      <div className="h-full flex">
        {/* Chat Sidebar */}
        <div className="w-80 border-r border-border">
          <ChatSidebar
            selectedChat={selectedChat}
            onChatSelect={handleChatSelect}
            className="h-full border-0"
          />
        </div>

        {/* Chat Window */}
        <div className="flex-1">
          {selectedChat ? (
            <ChatWindow
              chat={selectedChat}
              onClose={handleCloseChat}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-muted/20">
              <div className="text-center space-y-4">
                <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <MessageSquare className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Welcome to Chat</h3>
                  <p className="text-muted-foreground max-w-md">
                    Select a conversation from the sidebar to start messaging with your colleagues.
                  </p>
                </div>
                
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>Create groups and chat with your team</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>Send messages, files, and images</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <Settings className="h-4 w-4" />
                    <span>Role-based messaging permissions</span>
                  </div>
                </div>

                {user?.role && ['Admin', 'HR', 'Manager', 'Team Lead'].includes(user.role) && (
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="flex items-center justify-center space-x-2 text-blue-700 dark:text-blue-300">
                      <Badge variant="secondary">
                        {user.role}
                      </Badge>
                      <span className="text-sm">You can message anyone in the organization</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;