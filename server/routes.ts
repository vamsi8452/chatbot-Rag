import { Express, Request, Response } from "express";
import { createServer, Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { ChatRequest, ChatResponse, insertDocumentSchema, insertMessageSchema } from "@shared/schema";
import { startDocumentProcessing, getProcessingStatus, processQuery } from "./rag";
import { z } from "zod";
import { ZodError } from "zod-validation-error";

// Temporary upload directory
const UPLOADS_DIR = path.join(process.cwd(), 'temp-uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, UPLOADS_DIR);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (_req, file, cb) => {
    // Only accept PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // API Route: Get all messages
  app.get("/api/messages", async (_req: Request, res: Response) => {
    try {
      const messages = await storage.getMessagesInOrder();
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // API Route: Send a message
  app.post("/api/messages", async (req: Request, res: Response) => {
    try {
      const chatRequest = req.body as ChatRequest;
      
      // Validate request
      if (!chatRequest.message || typeof chatRequest.message !== 'string') {
        return res.status(400).json({ message: "Message is required" });
      }
      
      // Create user message
      const userMessage = await storage.createMessage({
        role: 'user',
        content: chatRequest.message,
        agentType: null
      });
      
      // Process the query to get a response
      const { response, agentType } = await processQuery(chatRequest.message);
      
      // Create assistant message
      const assistantMessage = await storage.createMessage({
        role: 'assistant',
        content: response,
        agentType: agentType
      });
      
      res.json(assistantMessage);
    } catch (error) {
      console.error("Error processing message:", error);
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  // API Route: Clear chat history
  app.post("/api/messages/clear", async (_req: Request, res: Response) => {
    try {
      await storage.clearMessages();
      res.json({ message: "Chat history cleared" });
    } catch (error) {
      console.error("Error clearing messages:", error);
      res.status(500).json({ message: "Failed to clear messages" });
    }
  });

  // API Route: Upload a PDF document
  app.post("/api/documents/upload", upload.single('file'), async (req: Request, res: Response) => {
    try {
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const { originalname, mimetype, path: filePath } = req.file;
      
      // Validate document data
      const documentData = insertDocumentSchema.parse({
        filename: originalname,
        contentType: mimetype,
        processingStatus: 'pending'
      });
      
      // Create document in storage
      const document = await storage.createDocument(documentData);
      
      // Start document processing
      const status = await startDocumentProcessing(filePath, document.id);
      
      res.json({ 
        documentId: document.id, 
        filename: document.filename,
        status: status.status,
        progress: status.progress
      });
    } catch (error) {
      console.error("Error uploading document:", error);
      
      // Handle validation errors
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid document data", errors: error.errors });
      }
      
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  // API Route: Get document processing status
  app.get("/api/documents/:id/status", async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      
      if (isNaN(documentId)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }
      
      const status = getProcessingStatus(documentId);
      
      if (!status) {
        const document = await storage.getDocument(documentId);
        
        if (!document) {
          return res.status(404).json({ message: "Document not found" });
        }
        
        return res.json({
          documentId,
          status: document.processingStatus,
          progress: document.processingStatus === 'processed' ? 100 : 0,
          step: document.processingStatus === 'processed' ? 'Complete' : 'Unknown',
          filename: document.filename
        });
      }
      
      res.json(status);
    } catch (error) {
      console.error("Error getting document status:", error);
      res.status(500).json({ message: "Failed to get document status" });
    }
  });

  // API Route: Get all documents
  app.get("/api/documents", async (_req: Request, res: Response) => {
    try {
      const documents = await storage.getAllDocuments();
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // API Route: System status
  app.get("/api/status", async (_req: Request, res: Response) => {
    try {
      const documents = await storage.getAllDocuments();
      const latestDocument = documents.length > 0 
        ? documents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
        : null;
      
      res.json({
        backend: "connected",
        vectorDb: "operational",
        currentDocument: latestDocument
          ? { id: latestDocument.id, filename: latestDocument.filename }
          : null
      });
    } catch (error) {
      console.error("Error getting system status:", error);
      res.status(500).json({ 
        backend: "connected",
        vectorDb: "error",
        currentDocument: null,
        error: error.message
      });
    }
  });

  return httpServer;
}
