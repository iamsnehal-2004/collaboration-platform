# Collaboration Platform

A modern, real-time collaboration platform built with React, Node.js, and MongoDB. Features include instant messaging, collaborative document editing, and workspace management.

## Features

- **Real-time Chat** - Instant messaging with typing indicators
- **Document Collaboration** - Live document editing with auto-save
- **Workspace Management** - Create and join workspaces with invite codes
- **User Authentication** - Secure JWT-based authentication
- **Online Status** - See who's currently active
- **Responsive Design** - Works on desktop and mobile

## Tech Stack

**Frontend**
- React.js with Vite
- Tailwind CSS
- Socket.IO Client
- React Router

**Backend**
- Node.js & Express
- MongoDB & Mongoose
- Socket.IO Server
- JWT Authentication

## Installation

### Prerequisites
- Node.js (v16+)
- MongoDB (v6+)
- npm or yarn

### Setup

1. Clone the repository
```bash
git clone https://github.com/iamsnehal-2004/collaboration-platform.git
cd collaboration-platform
```

2. Install dependencies
```bash
npm install
cd api && npm install
cd ../client && npm install
cd ..
```

3. Configure environment variables

Create `api/.env`:
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/collaboration-platform
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
```

Create `client/.env`:
```env
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
```

4. Start MongoDB
```bash
brew services start mongodb-community@8.0
```

5. Run the application
```bash
npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Usage

1. **Sign Up** - Create a new account
2. **Create Workspace** - Start a new collaboration space
3. **Invite Members** - Share the invite code with your team
4. **Collaborate** - Chat and edit documents in real-time

## Project Structure

```
collaboration-platform/
├── api/                    # Backend server
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API endpoints
│   ├── middleware/        # Auth middleware
│   ├── socket/            # WebSocket handlers
│   └── utils/             # Helper functions
├── client/                # Frontend application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── context/      # React context
│   │   └── utils/        # API & socket utilities
│   └── public/           # Static assets
└── package.json          # Root dependencies
```

## Deployment

### Vercel (Recommended)

1. Install Vercel CLI
```bash
npm i -g vercel
```

2. Deploy
```bash
vercel --prod
```

3. Set environment variables in Vercel dashboard

## License

MIT License - feel free to use this project for learning or commercial purposes.

## Author

Snehal Vishwakarma - Final Year Engineering Project

## Acknowledgments

Built as a final year project demonstrating full-stack development skills with modern web technologies.
