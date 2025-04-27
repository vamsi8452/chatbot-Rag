import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { X, Upload, Check, AlertCircle } from "lucide-react";

interface FileUploadModalProps {
  onClose: () => void;
  onUploadComplete: () => void;
}

interface UploadProgress {
  status: string;
  progress: number;
  step: string;
}

export default function FileUploadModal({ onClose, onUploadComplete }: FileUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [documentId, setDocumentId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload file');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setDocumentId(data.documentId);
      setUploadProgress({
        status: data.status,
        progress: data.progress,
        step: 'Uploading PDF'
      });
      
      // Begin polling for status
      startPollingStatus(data.documentId);
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Status polling
  const pollStatus = async (documentId: number) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/status`);
      if (!response.ok) {
        throw new Error('Failed to get document status');
      }
      
      const status = await response.json();
      setUploadProgress({
        status: status.status,
        progress: status.progress,
        step: status.step
      });
      
      return status;
    } catch (error) {
      console.error('Error polling status:', error);
      return { status: 'error', progress: 0, step: 'Error occurred' };
    }
  };

  // Start polling for status updates
  const startPollingStatus = (docId: number) => {
    const interval = setInterval(async () => {
      const status = await pollStatus(docId);
      
      if (status.status === 'processed' || status.status === 'error') {
        clearInterval(interval);
        
        if (status.status === 'processed') {
          toast({
            title: "Document processed",
            description: "Your document has been successfully processed.",
          });
          onUploadComplete();
        } else {
          toast({
            title: "Processing failed",
            description: status.step || "Failed to process document",
            variant: "destructive",
          });
        }
      }
    }, 2000);
    
    // Clean up the interval
    return () => clearInterval(interval);
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file",
          variant: "destructive",
        });
      }
    }
  };

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file",
          variant: "destructive",
        });
      }
    }
  };

  // Handle upload button click
  const handleUpload = () => {
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get step completion status
  const getStepStatus = (stepName: string): 'waiting' | 'in-progress' | 'complete' => {
    if (!uploadProgress) return 'waiting';
    
    const currentStep = uploadProgress.step;
    
    if (stepName === 'Uploading PDF' && uploadProgress.progress > 0) {
      return uploadProgress.progress === 100 ? 'complete' : 'in-progress';
    }
    
    if (stepName === 'Parsing document content') {
      if (currentStep === 'Parsing document content') return 'in-progress';
      if (uploadProgress.progress >= 50) return 'complete';
      return 'waiting';
    }
    
    if (stepName === 'Generating embeddings') {
      if (currentStep === 'Generating embeddings') return 'in-progress';
      if (uploadProgress.progress >= 75) return 'complete';
      return 'waiting';
    }
    
    if (stepName === 'Updating vector database') {
      if (currentStep === 'Updating vector database') return 'in-progress';
      if (uploadProgress.progress === 100) return 'complete';
      return 'waiting';
    }
    
    return 'waiting';
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a PDF document to be processed by the RAG system.
          </DialogDescription>
        </DialogHeader>

        {!uploadProgress ? (
          <>
            <div
              className={`file-drop-area flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-md ${
                isDragging ? 'border-primary-500 bg-primary-50' : 'border-neutral-300'
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 text-neutral-400 mb-4" />
              <p className="mb-2 font-medium">Drag and drop a PDF file here</p>
              <p className="text-sm text-neutral-500 mb-4">or click to browse files</p>
              <input
                type="file"
                id="file-input"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf"
                onChange={handleFileChange}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
              >
                Select File
              </Button>
            </div>

            {file && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-neutral-500">{formatFileSize(file.size)}</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="mt-4 space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">{file?.name}</span>
                <span className="text-xs text-neutral-500">{file ? formatFileSize(file.size) : ''}</span>
              </div>
              <Progress value={uploadProgress.progress} className="h-2" />
              <p className="text-xs text-neutral-500 mt-1">{uploadProgress.progress}% - {uploadProgress.step}</p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  getStepStatus('Uploading PDF') === 'complete' 
                    ? 'bg-green-500' 
                    : getStepStatus('Uploading PDF') === 'in-progress'
                      ? 'bg-primary-500' 
                      : 'bg-neutral-200'
                }`}>
                  {getStepStatus('Uploading PDF') === 'complete' && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </div>
                <span className={getStepStatus('Uploading PDF') === 'in-progress' ? 'text-primary-600 font-medium' : ''}>
                  Uploading PDF
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  getStepStatus('Parsing document content') === 'complete' 
                    ? 'bg-green-500' 
                    : getStepStatus('Parsing document content') === 'in-progress'
                      ? 'bg-primary-500' 
                      : 'bg-neutral-200'
                }`}>
                  {getStepStatus('Parsing document content') === 'complete' && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </div>
                <span className={getStepStatus('Parsing document content') === 'in-progress' ? 'text-primary-600 font-medium' : ''}>
                  Parsing document content
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  getStepStatus('Generating embeddings') === 'complete' 
                    ? 'bg-green-500' 
                    : getStepStatus('Generating embeddings') === 'in-progress'
                      ? 'bg-primary-500' 
                      : 'bg-neutral-200'
                }`}>
                  {getStepStatus('Generating embeddings') === 'complete' && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </div>
                <span className={getStepStatus('Generating embeddings') === 'in-progress' ? 'text-primary-600 font-medium' : ''}>
                  Generating embeddings
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  getStepStatus('Updating vector database') === 'complete' 
                    ? 'bg-green-500' 
                    : getStepStatus('Updating vector database') === 'in-progress'
                      ? 'bg-primary-500' 
                      : 'bg-neutral-200'
                }`}>
                  {getStepStatus('Updating vector database') === 'complete' && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </div>
                <span className={getStepStatus('Updating vector database') === 'in-progress' ? 'text-primary-600 font-medium' : ''}>
                  Updating vector database
                </span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="sm:justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={uploadMutation.isPending}
          >
            Cancel
          </Button>
          {!uploadProgress && (
            <Button
              type="submit"
              disabled={!file || uploadMutation.isPending}
              onClick={handleUpload}
            >
              {uploadMutation.isPending ? (
                <div className="flex items-center">
                  <span className="mr-2">Uploading</span>
                  <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                </div>
              ) : (
                'Upload & Process'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
