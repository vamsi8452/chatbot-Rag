import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Clock, MessageCircle, FileText, Settings, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SystemStatus {
  backend: string;
  vectorDb: string;
  currentDocument: {
    id: number;
    filename: string;
  } | null;
}

interface SidebarProps {
  systemStatus?: SystemStatus;
  isLoading: boolean;
}

export default function Sidebar({ systemStatus, isLoading }: SidebarProps) {
  const [location] = useLocation();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const toggleMobileNav = () => {
    setIsMobileNavOpen(!isMobileNavOpen);
  };

  return (
    <aside className="bg-white border-r border-neutral-200 w-full md:w-64 flex-shrink-0 flex flex-col overflow-hidden">
      {/* App title and logo */}
      <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-secondary-500 flex items-center justify-center text-white">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-semibold text-lg">Pink Protect</h1>
            <p className="text-xs text-neutral-500">RAG System</p>
          </div>
        </div>
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={toggleMobileNav}
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Navigation menu */}
      <nav
        className={`flex-1 overflow-y-auto p-4 space-y-1 ${
          isMobileNavOpen ? "block" : "hidden md:block"
        }`}
      >
        <Link href="/">
          <a
            className={`flex items-center space-x-2 p-2 rounded-md ${
              location === "/" ? "bg-primary-50 text-primary-600" : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            <MessageCircle className="h-5 w-5" />
            <span>Chat</span>
          </a>
        </Link>
        <Link href="/documents">
          <a
            className={`flex items-center space-x-2 p-2 rounded-md ${
              location === "/documents" ? "bg-primary-50 text-primary-600" : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            <FileText className="h-5 w-5" />
            <span>Documents</span>
          </a>
        </Link>
        <Link href="/settings">
          <a
            className={`flex items-center space-x-2 p-2 rounded-md ${
              location === "/settings" ? "bg-primary-50 text-primary-600" : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </a>
        </Link>
      </nav>

      {/* System status and info */}
      <div className="p-4 border-t border-neutral-200 space-y-2 text-sm">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            isLoading ? "bg-yellow-500" : 
            (systemStatus?.backend === "connected" ? "bg-green-500" : "bg-red-500")
          }`}></div>
          <span>Backend: {isLoading ? "Connecting..." : (systemStatus?.backend === "connected" ? "Connected" : "Disconnected")}</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            isLoading ? "bg-yellow-500" : 
            (systemStatus?.vectorDb === "operational" ? "bg-green-500" : "bg-red-500")
          }`}></div>
          <span>Vector DB: {isLoading ? "Loading..." : (systemStatus?.vectorDb === "operational" ? "Operational" : "Error")}</span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-neutral-500">
          <span>Current Document:</span>
          <span className="font-medium truncate">
            {isLoading 
              ? "Loading..." 
              : (systemStatus?.currentDocument?.filename || "No document loaded")}
          </span>
        </div>
      </div>
    </aside>
  );
}
