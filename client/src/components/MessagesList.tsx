import { forwardRef } from "react";
import { Avatar } from "@/components/ui/avatar";
import { User, MessageCircle, Bot } from "lucide-react";
import { Message } from "@shared/schema";
import { format } from "date-fns";

interface MessagesListProps {
  messages: Message[];
}

const MessagesList = forwardRef<HTMLDivElement, MessagesListProps>(
  ({ messages }, ref) => {
    return (
      <div className="max-w-3xl mx-auto space-y-4" ref={ref}>
        {messages.map((message) => {
          if (message.role === "user") {
            return <UserMessage key={message.id} message={message} />;
          } else if (message.role === "system") {
            return <SystemMessage key={message.id} message={message} />;
          } else if (message.role === "assistant") {
            return <AssistantMessage key={message.id} message={message} />;
          }
          return null;
        })}
      </div>
    );
  }
);

MessagesList.displayName = "MessagesList";

// User message component
function UserMessage({ message }: { message: Message }) {
  return (
    <div className="flex items-start justify-end message-animate">
      <div className="mr-3 bg-primary-50 rounded-lg px-4 py-3 text-sm text-neutral-800">
        <p>{message.content}</p>
        <div className="mt-1 text-xs text-neutral-500 flex justify-end">
          <span>{formatTime(message.createdAt)}</span>
        </div>
      </div>
      <Avatar className="h-8 w-8 bg-primary-600 text-white">
        <User className="h-5 w-5" />
      </Avatar>
    </div>
  );
}

// System message component
function SystemMessage({ message }: { message: Message }) {
  return (
    <div className="flex items-start max-w-3xl message-animate">
      <Avatar className="h-8 w-8 bg-primary-100 text-primary-600">
        <Bot className="h-5 w-5" />
      </Avatar>
      <div className="ml-3 bg-white rounded-lg px-4 py-3 shadow-sm border border-neutral-200">
        <div className="text-sm">{message.content}</div>
        <div className="mt-2 text-xs text-neutral-500 flex items-center">
          <span>System</span>
          <span className="mx-1">•</span>
          <span>{formatTime(message.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

// Assistant message component
function AssistantMessage({ message }: { message: Message }) {
  // Convert markdown to HTML for rendering
  const renderContent = () => {
    // Simple markdown transformation for basic formatting
    // For a production app, use a markdown library like marked
    let content = message.content;
    
    // Bold text
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic text
    content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Lists
    content = content.replace(/^\s*-\s*(.*)/gm, '<li>$1</li>');
    content = content.replace(/<li>.*?<\/li>/gs, (match) => `<ul>${match}</ul>`);
    
    // Numbered lists
    content = content.replace(/^\s*\d+\.\s*(.*)/gm, '<li>$1</li>');
    content = content.replace(/<li>.*?<\/li>/gs, (match) => 
      /^\d+\./.test(match) ? `<ol>${match}</ol>` : match
    );
    
    // Paragraphs
    content = content.replace(/\n\n/g, '</p><p>');
    
    return { __html: `<p>${content}</p>` };
  };

  // Format agent type for display
  const formatAgentType = (type: string | null) => {
    if (!type) return "System";
    
    switch (type) {
      case "technical":
        return "Technical Agent";
      case "usecase":
        return "Use-Case Agent";
      case "ethics":
        return "Ethics Agent";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  return (
    <div className="flex items-start max-w-3xl message-animate">
      <Avatar className="h-8 w-8 bg-primary-100 text-primary-600">
        <MessageCircle className="h-5 w-5" />
      </Avatar>
      <div className="ml-3 bg-white rounded-lg px-4 py-3 shadow-sm border border-neutral-200">
        <div className="text-sm" dangerouslySetInnerHTML={renderContent()} />
        <div className="mt-1 text-xs flex items-center">
          <span className="px-1.5 py-0.5 bg-primary-100 text-primary-800 rounded text-xs font-medium">
            {formatAgentType(message.agentType)}
          </span>
          <span className="mx-1 text-neutral-500">•</span>
          <span className="text-neutral-500">{formatTime(message.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

// Helper function to format time
function formatTime(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) {
    return "Just now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} min ago`;
  } else if (diffInMinutes < 24 * 60) {
    return format(date, "h:mm a");
  } else {
    return format(date, "MMM d, h:mm a");
  }
}

export default MessagesList;
