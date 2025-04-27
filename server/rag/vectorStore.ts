import { storage } from '../storage';
import { createEmbeddings } from './embedding';
import { Chunk } from '@shared/schema';

// In-memory vector store
class SimpleVectorStore {
  // Store document chunks with their embeddings
  private documents: {
    id: string;
    content: string;
    metadata: any;
    embedding: number[];
  }[] = [];

  /**
   * Add document chunks to the vector store
   */
  async addDocuments(chunks: Chunk[]): Promise<void> {
    if (chunks.length === 0) return;

    try {
      // Get text content from chunks for embedding
      const texts = chunks.map(chunk => chunk.content);
      
      // Generate embeddings for all texts
      const embeddings = await createEmbeddings(texts);
      
      // Add to in-memory store with embeddings
      chunks.forEach((chunk, index) => {
        this.documents.push({
          id: chunk.id.toString(),
          content: chunk.content,
          metadata: {
            documentId: chunk.documentId.toString(),
            // Use a safe default if we can't access metadata properties
            pageNumber: 1
          },
          embedding: embeddings[index]
        });
      });
      
      console.log(`Added ${chunks.length} chunks to vector store`);
    } catch (error: any) {
      console.error("Error adding chunks to vector store:", error);
      throw new Error(`Failed to add chunks to vector store: ${error.message || String(error)}`);
    }
  }

  /**
   * Remove documents by documentId
   */
  removeDocumentsByDocId(documentId: number): void {
    const docIdStr = documentId.toString();
    this.documents = this.documents.filter(
      doc => doc.metadata.documentId !== docIdStr
    );
    console.log(`Removed chunks for document ${documentId} from vector store`);
  }

  /**
   * Clear all documents
   */
  clear(): void {
    this.documents = [];
    console.log("Vector store cleared");
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error("Vectors must have the same length");
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    if (normA === 0 || normB === 0) {
      return 0;
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Search for similar documents
   */
  async search(query: string, limit: number = 5): Promise<any[]> {
    try {
      // If store is empty, return empty results
      if (this.documents.length === 0) {
        return [];
      }
      
      // Generate embedding for the query
      const queryEmbedding = (await createEmbeddings([query]))[0];
      
      // Calculate similarity scores
      const results = this.documents.map(doc => ({
        content: doc.content,
        metadata: doc.metadata,
        score: this.cosineSimilarity(queryEmbedding, doc.embedding)
      }));
      
      // Sort by similarity score (highest first)
      results.sort((a, b) => b.score - a.score);
      
      // Return top results
      return results.slice(0, limit);
    } catch (error: any) {
      console.error("Error searching vector store:", error);
      throw new Error(`Failed to search vector store: ${error.message || String(error)}`);
    }
  }
}

// Create a singleton instance
const vectorStore = new SimpleVectorStore();

/**
 * Adds document chunks to the vector store
 * @param chunks Array of document chunks from the storage
 */
export async function addDocumentChunks(chunks: Chunk[]): Promise<void> {
  return vectorStore.addDocuments(chunks);
}

/**
 * Retrieves relevant document chunks based on a query
 * @param query User query text
 * @param limit Maximum number of results to return
 * @returns Array of relevant chunks with their content and metadata
 */
export async function queryVectorStore(query: string, limit: number = 5): Promise<any[]> {
  return vectorStore.search(query, limit);
}

/**
 * Removes document chunks from the vector store by document ID
 * @param documentId ID of the document to remove chunks for
 */
export async function removeDocumentChunks(documentId: number): Promise<void> {
  vectorStore.removeDocumentsByDocId(documentId);
}

/**
 * Rebuilds the vector store from all document chunks in storage
 * Used when reprocessing documents or updating embeddings
 */
export async function rebuildVectorStore(): Promise<void> {
  try {
    // Clear the vector store
    vectorStore.clear();
    
    // Get all documents
    const documents = await storage.getAllDocuments();
    
    for (const document of documents) {
      // Skip documents that aren't fully processed
      if (document.processingStatus !== 'processed') {
        continue;
      }
      
      // Get all chunks for this document
      const chunks = await storage.getChunksByDocumentId(document.id);
      
      if (chunks.length > 0) {
        await addDocumentChunks(chunks);
      }
    }
    
    console.log("Vector store rebuilt successfully");
  } catch (error: any) {
    console.error("Error rebuilding vector store:", error);
    throw new Error(`Failed to rebuild vector store: ${error.message || String(error)}`);
  }
}
