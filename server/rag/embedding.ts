import OpenAI from 'openai';
import { EmbeddingFunction } from 'chromadb';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Creates embeddings for a given array of texts using OpenAI's embedding API
 * @param texts Array of text strings to be embedded
 * @returns Array of embedding vectors
 */
export async function createEmbeddings(texts: string[]): Promise<number[][]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: texts,
      encoding_format: "float",
    });

    return response.data.map(item => item.embedding);
  } catch (error) {
    console.error("Error creating embeddings:", error);
    throw new Error(`Failed to create embeddings: ${error.message}`);
  }
}

/**
 * Custom embedding function for ChromaDB that uses OpenAI's embedding API
 * This follows the EmbeddingFunction interface from ChromaDB
 */
export const openAIEmbeddingFunction: EmbeddingFunction = async (texts: string[]) => {
  return await createEmbeddings(texts);
};
