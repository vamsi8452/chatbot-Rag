# AI Chatbot

A modern, full-stack AI chatbot application built with TypeScript, React, and Node.js.

## Features

- Real-time chat interface
- AI-powered responses
- File upload and processing
- Vector database integration
- Modern UI with Tailwind CSS

## Project Structure

The project is organized into three main directories:

1. **Client** (`/client`)
   - React-based frontend
   - TypeScript for type safety
   - Tailwind CSS for styling
   - Real-time chat interface

2. **Server** (`/server`)
   - Node.js backend
   - Express.js for API routes
   - AI model integration
   - File processing

3. **Shared** (`/shared`)
   - Common TypeScript types
   - Shared utilities
   - Database schemas

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Docker (optional)
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/vamsi8452/Ai-chat-bot.git
   cd Ai-chat-bot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   # Copy example environment files
   cp .env.example .env
   ```

4. Start the application:
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm run build
   npm start
   ```

## Development

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

## License

MIT License - See LICENSE file for details
