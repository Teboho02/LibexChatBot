# LibexChatBot - Enhanced AI Chat Interface

## Overview
LibexChatBot is a modern, responsive chat interface designed to interact with Libex's AI system. This repository has undergone significant improvements to enhance user experience, performance, and maintainability.

## Major Improvements

### Frontend Enhancements
1. **Migration to React + TypeScript**
   - Converted from vanilla HTML/JS to a modern React application
   - Added TypeScript for improved type safety and developer experience
   - Implemented Vite as the build tool for faster development and better performance

2. **UI/UX Improvements**
   - Modern, responsive Material-UI based design
   - Smooth message animations with Typewriter effect
   - Enhanced chat bubble design with avatar integration
   - Improved scrolling behavior with auto-scroll to latest messages
   - Custom scrollbar styling for better visual consistency
   - Mobile-first responsive design

3. **State Management**
   - Implemented React hooks for efficient state management
   - Added message history tracking
   - Improved error handling and user feedback

### Backend Enhancements
1. **API Integration**
   - Integration with Google's Generative AI
   - Improved error handling and response formatting
   - Enhanced message context handling

2. **Performance Optimizations**
   - Efficient message processing
   - Optimized API calls with proper error boundaries
   - Implemented CORS for secure cross-origin requests

## Technical Stack

### Frontend
- React 18+
- TypeScript
- Material-UI
- Vite
- Typewriter-effect
- Axios

### Backend
- Node.js
- Express
- Google Generative AI
- CORS
- dotenv for environment management

## Setup Instructions

### Prerequisites
- Node.js 14+
- npm or yarn

### Frontend Setup
1. Navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a .env file with your API keys
4. Start the server:
   ```bash
   npm start
   ```

## Key Features

### Chat Interface
- Real-time message updates
- Typing indicators
- Message history preservation
- Smooth animations
- Error handling with user-friendly messages

### AI Integration
- Context-aware responses
- Efficient token usage
- Secure API integration
- Response formatting and styling

## Security Improvements
- Environment variable management
- CORS protection
- Input validation
- Error boundary implementation

## Future Improvements
- Message persistence
- User authentication
- Enhanced context management
- Additional UI themes
- Voice input/output support

## Support
For technical support, please contact:
Email: support@libex.ai
Support Hours: Monday-Friday, 8:00 AM - 4:00 PM (CAT)

## Location
WITS Innovation Hub,
Tshimologong Precinct,
41 Juta St, Braamfontein,
Johannesburg, 2017

## License
ISC License