import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Send, Clock, Upload } from "lucide-react";
import MessagesList from "./MessagesList";
import { Message } from "@shared/schema";

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  onSendMessage: (message: string) => void;
  onClearConversation: () => void;
  onUploadDocument: () => void;
  currentDocument: { id: number; filename: string } | null;
}

export default function ChatInterface({
  messages,
  isLoading,
  isSending,
  onSendMessage,
  onClearConversation,
  onUploadDocument,
  currentDocument
}: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim() && !isSending) {
      onSendMessage(message);
      setMessage("");
    }
  };

  return (
    <main className="flex-1 flex flex-col overflow-hidden bg-neutral-50">
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Toolbar with document controls */}
        <div className="bg-white border-b border-neutral-200 p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">
              {currentDocument
                ? `Pink Protect: ${currentDocument.filename}`
                : "Pink Protect: Women's Safety Smartwatch"}
            </span>
            <span className="text-xs px-2 py-0.5 bg-neutral-100 rounded-full">RAG Enabled</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center space-x-1 text-sm font-medium text-primary-600 px-3 py-1.5 rounded-md hover:bg-primary-50"
              onClick={onUploadDocument}
            >
              <Upload className="h-4 w-4" />
              <span>Upload PDF</span>
            </Button>
          </div>
        </div>

        {/* Messages container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
            </div>
          ) : (
            <MessagesList messages={messages} />
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input box for user queries */}
        <div className="border-t border-neutral-200 bg-white p-4">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="relative">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Ask a question about the Pink Protect smartwatch..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isSending}
                className="w-full p-3 pr-20 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
              <Button
                type="submit"
                disabled={!message.trim() || isSending}
                className="absolute right-2 top-2 bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                {isSending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </form>
            <div className="flex mt-2 text-xs text-neutral-500 space-x-4 justify-center">
              <button
                onClick={onClearConversation}
                className="hover:text-primary-600"
              >
                Clear conversation
              </button>
              <span>|</span>
              <div className="flex items-center space-x-1">
                <span>Agents:</span>
                <span className="px-1.5 py-0.5 bg-neutral-100 rounded">Technical</span>
                <span className="px-1.5 py-0.5 bg-neutral-100 rounded">Use-Case</span>
                <span className="px-1.5 py-0.5 bg-neutral-100 rounded">Ethics</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
