import OpenAI from 'openai';
import { queryVectorStore } from './vectorStore';
import { AgentType } from '@shared/schema';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const GPT_MODEL = "gpt-4o";

/**
 * Determines which agent should handle the user's query
 * @param query User's question
 * @returns The agent type that should handle the query
 */
export async function determineAgentType(query: string): Promise<AgentType> {
  try {
    const response = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages: [
        {
          role: "system",
          content: `You are a query classifier for a safety smartwatch for women in India. 
          Classify the user's query into one of these categories:
          - "technical": for questions about hardware, specs, battery, technical operation, or hidden camera detection
          - "usecase": for questions about usage scenarios, user experiences, real-world applications
          - "ethics": for questions about privacy, data protection, ethical implications, societal impact
          
          Return only the category name, nothing else.`
        },
        {
          role: "user",
          content: query
        }
      ],
      temperature: 0.1,
      max_tokens: 10
    });

    const classification = response.choices[0].message.content?.trim().toLowerCase();
    
    if (classification === "technical") {
      return AgentType.TECHNICAL;
    } else if (classification === "usecase") {
      return AgentType.USECASE;
    } else if (classification === "ethics") {
      return AgentType.ETHICS;
    }
    
    // Default to technical if classification is unclear
    return AgentType.TECHNICAL;
  } catch (error) {
    console.error("Error determining agent type:", error);
    // Default to technical agent in case of error
    return AgentType.TECHNICAL;
  }
}

/**
 * The Technical Agent specializes in hardware, specifications, and technical operations
 */
async function technicalAgent(query: string, context: string): Promise<string> {
  const systemPrompt = `You are the Technical Agent for the Pink Protect safety smartwatch for women in India.
  You specialize in hardware specifications, battery life, technical operations, and the hidden camera detection feature.
  Answer questions based only on the context provided. If the information isn't in the context, say you don't have that specific information.
  Format your answers with Markdown when appropriate for better readability.`;
  
  return generateResponse(query, context, systemPrompt);
}

/**
 * The Use-Case Agent specializes in real-world scenarios and applications
 */
async function useCaseAgent(query: string, context: string): Promise<string> {
  const systemPrompt = `You are the Use-Case Agent for the Pink Protect safety smartwatch for women in India.
  You specialize in practical applications, user personas, scenarios, and how the smartwatch functions in real-world situations.
  You can explain market needs based on statistics and describe potential user experiences.
  Answer questions based only on the context provided. If the information isn't in the context, say you don't have that specific information.
  Format your answers with Markdown when appropriate for better readability.`;
  
  return generateResponse(query, context, systemPrompt);
}

/**
 * The Ethics Agent specializes in privacy, data protection, and ethical implications
 */
async function ethicsAgent(query: string, context: string): Promise<string> {
  const systemPrompt = `You are the Ethics Agent for the Pink Protect safety smartwatch for women in India.
  You specialize in privacy concerns, data protection, ethical implications, and societal impact of the technology.
  You can address security features, compliance with regulations, and ethical design considerations.
  Answer questions based only on the context provided. If the information isn't in the context, say you don't have that specific information.
  Format your answers with Markdown when appropriate for better readability.`;
  
  return generateResponse(query, context, systemPrompt);
}

/**
 * Generates a response from OpenAI based on the system prompt, user query, and context
 */
async function generateResponse(query: string, context: string, systemPrompt: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Context information from the document:\n\n${context}\n\nUser query: ${query}`
        }
      ],
      temperature: 0.7,
      max_tokens: 800
    });

    return response.choices[0].message.content || "I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Error generating response:", error);
    return "I'm sorry, but I encountered an error while processing your request. Please try again later.";
  }
}

/**
 * Main function to process a user query with the appropriate agent
 * @param query User's question
 * @returns Object containing the response and the agent type that generated it
 */
export async function processQuery(query: string): Promise<{ response: string, agentType: AgentType }> {
  try {
    // Step 1: Determine which agent should handle the query
    const agentType = await determineAgentType(query);
    console.log(`Using ${agentType} agent for query: "${query}"`);
    
    // Step 2: Retrieve relevant context from the vector store
    console.log("Retrieving context for query...");
    const results = await queryVectorStore(query, 5);
    console.log(`Found ${results.length} relevant chunks for context`);
    
    // Step 3: Format the context for the agent
    let context = results.map(result => result.content).join("\n\n");
    if (!context || context.trim() === '') {
      context = "No specific information found in the document related to this query.";
      console.log("No context found for query, using default message");
    }
    
    // Step 4: Route to the appropriate agent
    let response: string;
    
    switch (agentType) {
      case AgentType.TECHNICAL:
        response = await technicalAgent(query, context);
        break;
      case AgentType.USECASE:
        response = await useCaseAgent(query, context);
        break;
      case AgentType.ETHICS:
        response = await ethicsAgent(query, context);
        break;
      default:
        response = await technicalAgent(query, context);
    }
    
    return { response, agentType };
  } catch (error) {
    console.error("Error processing query:", error);
    return { 
      response: "I'm sorry, but I encountered an error while processing your request. Please try again later.", 
      agentType: AgentType.TECHNICAL 
    };
  }
}
