import {
  users, type User, type InsertUser,
  documents, type Document, type InsertDocument,
  chunks, type Chunk, type InsertChunk,
  messages, type Message, type InsertMessage
} from "@shared/schema";

// Storage interface for all entities
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Document methods
  getDocument(id: number): Promise<Document | undefined>;
  getAllDocuments(): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocumentStatus(id: number, status: string): Promise<Document>;
  
  // Chunk methods
  getChunksByDocumentId(documentId: number): Promise<Chunk[]>;
  createChunk(chunk: InsertChunk): Promise<Chunk>;
  deleteChunksByDocumentId(documentId: number): Promise<void>;
  
  // Message methods
  getAllMessages(): Promise<Message[]>;
  getMessagesInOrder(): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  clearMessages(): Promise<void>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private documents: Map<number, Document>;
  private chunks: Map<number, Chunk>;
  private messages: Map<number, Message>;
  
  private currentUserId: number;
  private currentDocumentId: number;
  private currentChunkId: number;
  private currentMessageId: number;

  constructor() {
    this.users = new Map();
    this.documents = new Map();
    this.chunks = new Map();
    this.messages = new Map();
    
    this.currentUserId = 1;
    this.currentDocumentId = 1;
    this.currentChunkId = 1;
    this.currentMessageId = 1;
    
    // Initialize with a system welcome message
    this.createMessage({
      role: 'system',
      content: "Welcome to the Pink Protect RAG System! I'm here to help answer questions about the Safety Smartwatch for Women in India design blueprint. You can ask me about: technical specifications, user scenarios, market data, and ethical considerations.",
      agentType: null
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const createdAt = new Date();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Document methods
  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }
  
  async getAllDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }
  
  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.currentDocumentId++;
    const createdAt = new Date();
    const document: Document = { 
      ...insertDocument, 
      id, 
      createdAt
    };
    this.documents.set(id, document);
    return document;
  }
  
  async updateDocumentStatus(id: number, status: string): Promise<Document> {
    const document = await this.getDocument(id);
    if (!document) {
      throw new Error(`Document with id ${id} not found`);
    }
    
    const updatedDocument: Document = {
      ...document,
      processingStatus: status
    };
    
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }
  
  // Chunk methods
  async getChunksByDocumentId(documentId: number): Promise<Chunk[]> {
    return Array.from(this.chunks.values()).filter(
      (chunk) => chunk.documentId === documentId
    );
  }
  
  async createChunk(insertChunk: InsertChunk): Promise<Chunk> {
    const id = this.currentChunkId++;
    const createdAt = new Date();
    const chunk: Chunk = {
      ...insertChunk,
      id,
      createdAt
    };
    this.chunks.set(id, chunk);
    return chunk;
  }
  
  async deleteChunksByDocumentId(documentId: number): Promise<void> {
    for (const [id, chunk] of this.chunks.entries()) {
      if (chunk.documentId === documentId) {
        this.chunks.delete(id);
      }
    }
  }
  
  // Message methods
  async getAllMessages(): Promise<Message[]> {
    return Array.from(this.messages.values());
  }
  
  async getMessagesInOrder(): Promise<Message[]> {
    return Array.from(this.messages.values()).sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );
  }
  
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const createdAt = new Date();
    const message: Message = {
      ...insertMessage,
      id,
      createdAt
    };
    this.messages.set(id, message);
    return message;
  }
  
  async clearMessages(): Promise<void> {
    this.messages.clear();
    this.currentMessageId = 1;
    
    // Re-add the welcome message
    await this.createMessage({
      role: 'system',
      content: "Welcome to the Pink Protect RAG System! I'm here to help answer questions about the Safety Smartwatch for Women in India design blueprint. You can ask me about: technical specifications, user scenarios, market data, and ethical considerations.",
      agentType: null
    });
  }
}

// Export a singleton instance of MemStorage
export const storage = new MemStorage();
