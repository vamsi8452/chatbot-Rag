# Pink Protect RAG Chatbot

A local Retrieval-Augmented Generation (RAG) chatbot that provides a conversational interface over the "Smartwatch Safety" research report PDF. This application runs entirely on your local machine with no cloud services required (except for OpenAI API calls).

## Features

- **PDF Ingestion**: Upload and parse the "Smartwatch Safety" research report PDF
- **Intelligent Text Chunking**: Break down the document into semantically meaningful chunks
- **Embeddings Computation**: Using OpenAI or open-source alternatives
- **Local Vector Database**: Store embeddings in a file-based vector database
- **RAG Pipeline**: Retrieve relevant context from the vector store to answer user questions
- **AI Agents**: Specialized agents for Technical, Use-Case, and Ethics questions
- **Clean React UI**: Modern chat interface with message history
- **File Upload**: Upload and swap PDFs to rebuild the vector store

## Prerequisites

- Node.js >= 14
- npm or yarn
- OpenAI API key

## Setup Instructions

1. Clone the repository:

```bash
git clone https://github.com/yourusername/pink-protect-rag.git
cd pink-protect-rag
