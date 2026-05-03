# Quick Setup Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies
```bash
npm run install:all
```

### Step 2: Setup Environment Variables

**Backend (api/.env):**
```bash
cd api
cp .env.example .env
```

Edit `api/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/collaboration-platform
JWT_SECRET=your-secret-key-here
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

**Frontend (client/.env):**
```bash
cd client
cp .env.example .env
```

Edit `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Step 3: Start MongoDB

**Local MongoDB:**
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

**Or use MongoDB Atlas** (cloud) - Update MONGODB_URI in api/.env

### Step 4: Run the Application
```bash
npm run dev
```

This will start:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

### Step 5: Test the Application

1. Open http://localhost:5173
2. Click "Create a new account"
3. Sign up with your details
4. Create a workspace
5. Share the invite code with others
6. Start collaborating!

## 📝 Default Test Credentials

You can create your own accounts. No default credentials needed.

## 🔧 Troubleshooting

**MongoDB not connecting?**
```bash
# Check if MongoDB is running
mongosh
```

**Port already in use?**
```bash
# Kill process on port
lsof -ti:5000 | xargs kill -9  # Backend
lsof -ti:5173 | xargs kill -9  # Frontend
```

**Dependencies issues?**
```bash
# Clean install
rm -rf node_modules */node_modules
npm run install:all
```

## 📚 Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Explore the API endpoints
- Customize the UI with Tailwind CSS
- Deploy to Vercel

## 🎯 Key Features to Try

1. **Real-time Chat** - Send messages and see them appear instantly
2. **Document Editor** - Edit documents collaboratively
3. **Typing Indicators** - See when others are typing
4. **Online Status** - Know who's online
5. **Workspace Invites** - Share invite codes

---

**Need help?** Check the main README.md file for comprehensive documentation.