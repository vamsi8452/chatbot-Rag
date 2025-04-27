import fs from 'fs';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { storage } from '../storage';
import { type Document as DocumentType, type InsertChunk } from '@shared/schema';

/**
 * Parses a PDF file, splits it into chunks, and stores the chunks in the database.
 * @param pdfPath Path to the PDF file
 * @param document Document metadata from the database
 * @returns The number of chunks created
 */
export async function parsePdfFile(pdfPath: string, document: DocumentType): Promise<number> {
  try {
    // Load the PDF file
    const loader = new PDFLoader(pdfPath);
    const docs = await loader.load();
    
    // Text splitter configuration for optimal RAG
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ["\n\n", "\n", ".", "!", "?", ",", " ", ""],
    });
    
    // Split the document into chunks
    const chunks = await textSplitter.splitDocuments(docs);
    
    // Clear existing chunks for this document if any
    await storage.deleteChunksByDocumentId(document.id);
    
    // Store each chunk in the database
    for (const chunk of chunks) {
      const insertChunk: InsertChunk = {
        documentId: document.id,
        content: chunk.pageContent,
        metadata: chunk.metadata
      };
      
      await storage.createChunk(insertChunk);
    }
    
    return chunks.length;
  } catch (error: any) {
    console.error("Error parsing PDF:", error);
    throw new Error(`Failed to parse PDF: ${error.message || String(error)}`);
  } finally {
    // Clean up the temporary file
    try {
      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
      }
    } catch (cleanupError) {
      console.error("Error cleaning up temporary PDF file:", cleanupError);
    }
  }
}

/**
 * Processes a PDF file by parsing it and updating the document status.
 * This function is designed to be called asynchronously.
 */
export async function processPdfDocument(
  pdfPath: string, 
  document: DocumentType,
  onProgress: (status: string, progress: number, step: string) => void
): Promise<void> {
  try {
    // Update status to processing
    await storage.updateDocumentStatus(document.id, 'processing');
    onProgress('processing', 25, 'Parsing document content');
    
    // Parse the PDF file
    const chunkCount = await parsePdfFile(pdfPath, document);
    onProgress('processing', 50, 'Generating embeddings');
    
    // Get the chunks and add them to the vector store
    const chunks = await storage.getChunksByDocumentId(document.id);
    const { addDocumentChunks } = await import('./vectorStore');
    await addDocumentChunks(chunks);
    onProgress('processing', 75, 'Updating vector database');
    
    // Update document status to processed
    await storage.updateDocumentStatus(document.id, 'processed');
    onProgress('processed', 100, 'Complete');
    
    console.log(`Successfully processed document ${document.filename} with ${chunkCount} chunks`);
  } catch (error: any) {
    console.error(`Error processing document ${document.id}:`, error);
    await storage.updateDocumentStatus(document.id, 'error');
    onProgress('error', 0, `Error: ${error.message || String(error)}`);
  }
}
