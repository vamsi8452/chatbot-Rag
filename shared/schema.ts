import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table for authentication (if needed later)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Documents table to track uploaded PDFs
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  contentType: text("content_type").notNull(),
  processingStatus: text("processing_status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  filename: true,
  contentType: true,
  processingStatus: true
});

// Chunks table to store document chunks for RAG
export const chunks = pgTable("chunks", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const insertChunkSchema = createInsertSchema(chunks).pick({
  documentId: true,
  content: true,
  metadata: true
});

// Messages table to track chat history
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  role: text("role").notNull(), // 'user', 'system', 'assistant'
  content: text("content").notNull(),
  agentType: text("agent_type"), // 'technical', 'usecase', 'ethics'
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  role: true,
  content: true,
  agentType: true
});

// Define types for TypeScript
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type Chunk = typeof chunks.$inferSelect;
export type InsertChunk = z.infer<typeof insertChunkSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// Chat response types
export type ChatRequest = {
  message: string;
};

export type ChatResponse = {
  id: number;
  role: string;
  content: string;
  agentType: string;
  createdAt: Date;
};

// Document upload types
export type DocumentProcessingStatus = {
  documentId: number;
  status: string;
  progress: number;
  step: string;
  filename: string;
};

// Define agent types for reference
export enum AgentType {
  TECHNICAL = 'technical',
  USECASE = 'usecase',
  ETHICS = 'ethics'
}
