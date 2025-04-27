import { processPdfDocument } from './pdfParser';
import { addDocumentChunks, queryVectorStore, removeDocumentChunks, rebuildVectorStore } from './vectorStore';
import { processQuery, determineAgentType } from './agents';
import { storage } from '../storage';
import { DocumentProcessingStatus } from '@shared/schema';

// Map to track document processing status
const processingStatusMap = new Map<number, DocumentProcessingStatus>();

/**
 * Starts the processing of a PDF document
 * @param filePath Path to the PDF file
 * @param documentId ID of the document in storage
 */
export async function startDocumentProcessing(filePath: string, documentId: number): Promise<DocumentProcessingStatus> {
  const document = await storage.getDocument(documentId);
  
  if (!document) {
    throw new Error(`Document with ID ${documentId} not found`);
  }
  
  const status: DocumentProcessingStatus = {
    documentId,
    status: 'pending',
    progress: 0,
    step: 'Initializing',
    filename: document.filename
  };
  
  processingStatusMap.set(documentId, status);
  
  // Start processing in the background
  processPdfDocument(
    filePath,
    document,
    (status, progress, step) => {
      updateProcessingStatus(documentId, status, progress, step);
    }
  ).catch(error => {
    console.error(`Error processing document ${documentId}:`, error);
    updateProcessingStatus(documentId, 'error', 0, `Error: ${error.message}`);
  });
  
  return status;
}

/**
 * Updates the processing status of a document
 */
function updateProcessingStatus(
  documentId: number,
  status: string,
  progress: number,
  step: string
): void {
  const currentStatus = processingStatusMap.get(documentId);
  
  if (currentStatus) {
    const updatedStatus: DocumentProcessingStatus = {
      ...currentStatus,
      status,
      progress,
      step
    };
    
    processingStatusMap.set(documentId, updatedStatus);
  }
}

/**
 * Gets the processing status of a document
 */
export function getProcessingStatus(documentId: number): DocumentProcessingStatus | undefined {
  return processingStatusMap.get(documentId);
}

/**
 * Exports all necessary functions for the RAG system
 */
export {
  addDocumentChunks,
  queryVectorStore,
  removeDocumentChunks,
  rebuildVectorStore,
  processQuery,
  determineAgentType
};
