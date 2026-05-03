# Modern Serverless Collaboration Platform

A full-stack, real-time collaboration platform built with React, Node.js, MongoDB, and Socket.IO. Perfect for team collaboration with features like real-time chat, document editing, and workspace management.

## 🚀 Features

### Core Features
- ✅ **User Authentication** - JWT-based signup/login with secure password hashing
- ✅ **Workspace Management** - Create and join multiple workspaces
- ✅ **Real-time Chat** - WebSocket-powered instant messaging
- ✅ **Collaborative Document Editor** - Real-time document editing with auto-save
- ✅ **Online Status** - See who's online in your workspace
- ✅ **Typing Indicators** - Know when someone is typing
- ✅ **Invite System** - Share workspace invite codes
- ✅ **Responsive Design** - Works on desktop and mobile

### Technical Features
- Modern React with Hooks and Context API
- Serverless-ready Node.js backend
- MongoDB with Mongoose ODM
- Socket.IO for real-time communication
- Tailwind CSS for styling
- JWT authentication
- RESTful API design

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (local installation or MongoDB Atlas account)

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd collaboration-platform
```

### 2. Install Dependencies

Install dependencies for both client and server:

```bash
# Install root dependencies
npm install

# Install all dependencies (root, client, and API)
npm run install:all
```

### 3. Environment Configuration

#### Backend Configuration (API)

Create `api/.env` file:

```bash
cd api
cp .env.example .env
```

Edit `api/.env` with your configuration:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/collaboration-platform
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/collaboration-platform

# JWT Secret (use a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Configuration
PORT=5000
NODE_ENV=development

# Client URL (for CORS)
CLIENT_URL=http://localhost:5173
```

#### Frontend Configuration (Client)

Create `client/.env` file:

```bash
cd client
cp .env.example .env
```

Edit `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 4. Setup MongoDB

#### Option A: Local MongoDB

1. Install MongoDB Community Edition
2. Start MongoDB service:
   ```bash
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   
   # Windows
   net start MongoDB
   ```

#### Option B: MongoDB Atlas (Cloud)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get connection string and update `MONGODB_URI` in `api/.env`

## 🚀 Running the Application

### Development Mode

Run both client and server concurrently:

```bash
npm run dev
```

Or run them separately:

```bash
# Terminal 1 - Run API server
cd api
npm run dev

# Terminal 2 - Run React client
cd client
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/health

## 📁 Project Structure

```
collaboration-platform/
├── api/                          # Backend (Node.js + Express)
│   ├── models/                   # MongoDB models
│   │   ├── User.js              # User schema
│   │   ├── Workspace.js         # Workspace schema
│   │   └── Message.js           # Message schema
│   ├── routes/                   # API routes
│   │   ├── auth.js              # Authentication routes
│   │   ├── workspace.js         # Workspace routes
│   │   └── message.js           # Message routes
│   ├── middleware/               # Express middleware
│   │   └── auth.js              # JWT authentication middleware
│   ├── utils/                    # Utility functions
│   │   ├── db.js                # Database connection
│   │   └── jwt.js               # JWT utilities
│   ├── socket/                   # WebSocket logic
│   │   └── index.js             # Socket.IO setup
│   ├── server.js                # Main server file
│   ├── package.json             # Backend dependencies
│   └── .env.example             # Environment variables template
│
├── client/                       # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/          # React components
│   │   │   └── PrivateRoute.jsx # Protected route component
│   │   ├── context/             # React Context
│   │   │   └── AuthContext.jsx  # Authentication context
│   │   ├── pages/               # Page components
│   │   │   ├── Login.jsx        # Login page
│   │   │   ├── Signup.jsx       # Signup page
│   │   │   ├── Dashboard.jsx    # Dashboard page
│   │   │   └── Workspace.jsx    # Workspace page
│   │   ├── utils/               # Utility functions
│   │   │   ├── api.js           # API client
│   │   │   └── socket.js        # Socket.IO client
│   │   ├── App.jsx              # Main App component
│   │   ├── main.jsx             # Entry point
│   │   └── index.css            # Global styles
│   ├── public/                  # Static assets
│   ├── index.html               # HTML template
│   ├── vite.config.js           # Vite configuration
│   ├── tailwind.config.js       # Tailwind CSS configuration
│   ├── postcss.config.js        # PostCSS configuration
│   ├── package.json             # Frontend dependencies
│   └── .env.example             # Environment variables template
│
├── package.json                 # Root package.json
├── vercel.json                  # Vercel deployment config
├── .gitignore                   # Git ignore rules
└── README.md                    # This file
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/logout` - Logout user

### Workspaces
- `GET /api/workspace` - Get all user workspaces
- `GET /api/workspace/:id` - Get workspace by ID
- `POST /api/workspace` - Create new workspace
- `PUT /api/workspace/:id` - Update workspace
- `POST /api/workspace/join` - Join workspace with invite code
- `DELETE /api/workspace/:id/leave` - Leave workspace
- `PUT /api/workspace/:id/document` - Update workspace document

### Messages
- `GET /api/message/:workspaceId` - Get workspace messages
- `POST /api/message/:workspaceId` - Send message
- `PUT /api/message/:messageId` - Edit message
- `DELETE /api/message/:messageId` - Delete message
- `POST /api/message/:messageId/read` - Mark message as read

## 🔌 WebSocket Events

### Client → Server
- `join-workspace` - Join workspace room
- `leave-workspace` - Leave workspace room
- `send-message` - Send chat message
- `typing-start` - Start typing indicator
- `typing-stop` - Stop typing indicator
- `document-change` - Update document content
- `cursor-move` - Send cursor position

### Server → Client
- `new-message` - Receive new message
- `user-joined` - User joined workspace
- `user-left` - User left workspace
- `user-typing` - User is typing
- `user-stopped-typing` - User stopped typing
- `document-updated` - Document was updated
- `online-users` - List of online users
- `notification` - General notification

## 🚢 Deployment

### Deploy to Vercel

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Set environment variables in Vercel dashboard:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `CLIENT_URL`
   - `NODE_ENV=production`

5. For production deployment:
   ```bash
   vercel --prod
   ```

### Environment Variables for Production

In Vercel dashboard, add these secrets:
- `@mongodb-uri` - Your MongoDB connection string
- `@jwt-secret` - Your JWT secret key

## 🧪 Testing

### Test User Flow

1. **Signup**: Create a new account
2. **Login**: Sign in with credentials
3. **Create Workspace**: Create a new collaboration workspace
4. **Invite Others**: Share the invite code
5. **Chat**: Send real-time messages
6. **Document**: Edit the shared document
7. **Online Status**: See who's online

## 🛡️ Security Features

- Password hashing with bcrypt
- JWT token authentication
- Protected API routes
- CORS configuration
- Input validation
- XSS protection
- MongoDB injection prevention

## 🎨 UI/UX Features

- Clean, modern interface
- Responsive design
- Loading states
- Error handling
- Toast notifications
- Typing indicators
- Online status indicators
- Auto-scroll chat
- Auto-save documents

## 📝 Development Notes

### Code Quality
- Clean code principles
- Comprehensive comments
- Error handling
- Modular architecture
- Reusable components

### Best Practices
- Environment variables for configuration
- Separate concerns (MVC pattern)
- RESTful API design
- WebSocket event naming conventions
- Proper error messages

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
mongosh

# Restart MongoDB service
brew services restart mongodb-community  # macOS
sudo systemctl restart mongod            # Linux
```

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Dependencies Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
rm -rf client/node_modules client/package-lock.json
rm -rf api/node_modules api/package-lock.json
npm run install:all
```

## 📚 Technologies Used

### Frontend
- React 18
- Vite
- React Router DOM
- Axios
- Socket.IO Client
- Tailwind CSS
- React Toastify
- Lucide React (icons)

### Backend
- Node.js
- Express
- MongoDB
- Mongoose
- Socket.IO
- JWT
- Bcrypt
- CORS
- Dotenv

## 👥 Contributing

This is a final year engineering project. Feel free to fork and modify for your own use.

## 📄 License

MIT License - feel free to use this project for learning and development.

## 🙏 Acknowledgments

- Built as a final year engineering project
- Demonstrates modern full-stack development practices
- Serverless-ready architecture
- Production-ready code structure

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the code comments
3. Check MongoDB connection
4. Verify environment variables

---

**Happy Collaborating! 🚀**