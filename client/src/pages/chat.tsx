import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import ChatInterface from "@/components/ChatInterface";
import FileUploadModal from "@/components/FileUploadModal";
import { Message } from "@shared/schema";

export default function Chat() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { toast } = useToast();

  // Fetch messages
  const { 
    data: messages, 
    isLoading: messagesLoading 
  } = useQuery({
    queryKey: ['/api/messages'],
  });

  // Fetch system status
  const { 
    data: systemStatus, 
    isLoading: statusLoading 
  } = useQuery({
    queryKey: ['/api/status'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Get all documents
  const { 
    data: documents,
    isLoading: documentsLoading
  } = useQuery({
    queryKey: ['/api/documents'],
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest(
        'POST',
        '/api/messages',
        { message }
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
    },
    onError: (error) => {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Clear messages mutation
  const clearMessagesMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/messages/clear', {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      toast({
        title: "Conversation cleared",
        description: "All messages have been cleared.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error clearing messages",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle message send
  const handleSendMessage = (message: string) => {
    if (message.trim()) {
      sendMessageMutation.mutate(message);
    }
  };

  // Handle clear conversation
  const handleClearConversation = () => {
    clearMessagesMutation.mutate();
  };

  // Open upload modal
  const handleOpenUploadModal = () => {
    setShowUploadModal(true);
  };

  // Close upload modal
  const handleCloseUploadModal = () => {
    setShowUploadModal(false);
  };

  // When upload is complete
  const handleUploadComplete = () => {
    setShowUploadModal(false);
    queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    queryClient.invalidateQueries({ queryKey: ['/api/status'] });
  };

  return (
    <div className="h-screen flex flex-col md:flex-row">
      <Sidebar
        systemStatus={systemStatus}
        isLoading={statusLoading}
      />
      
      <ChatInterface
        messages={messages || []}
        isLoading={messagesLoading || documentsLoading}
        isSending={sendMessageMutation.isPending}
        onSendMessage={handleSendMessage}
        onClearConversation={handleClearConversation}
        onUploadDocument={handleOpenUploadModal}
        currentDocument={systemStatus?.currentDocument}
      />
      
      {showUploadModal && (
        <FileUploadModal
          onClose={handleCloseUploadModal}
          onUploadComplete={handleUploadComplete}
        />
      )}
    </div>
  );
}
