const { Server } = require('socket.io');
const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Message = require('../models/Message');

/**
 * WebSocket Server Setup
 * Handles real-time communication for chat, document editing, and notifications
 */

// Store active users and their socket connections
const activeUsers = new Map(); // userId -> { socketId, workspaceId }
const typingUsers = new Map(); // workspaceId -> Set of userIds

/**
 * Initialize Socket.IO server
 * @param {Object} server - HTTP server instance
 * @returns {Object} - Socket.IO server instance
 */
const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // Verify token
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.userId);

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      // Attach user to socket
      socket.userId = user._id.toString();
      socket.user = user;

      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', async (socket) => {
    console.log(`✅ User connected: ${socket.user.name} (${socket.userId})`);

    // Update user online status
    await User.findByIdAndUpdate(socket.userId, {
      isOnline: true,
      lastSeen: new Date()
    });

    // Store active user
    activeUsers.set(socket.userId, {
      socketId: socket.id,
      workspaceId: null
    });

    /**
     * Join workspace room
     */
    socket.on('join-workspace', async (workspaceId) => {
      try {
        const workspace = await Workspace.findById(workspaceId);

        if (!workspace || !workspace.isMember(socket.userId)) {
          socket.emit('error', { message: 'Cannot join workspace' });
          return;
        }

        // Leave previous workspace room if any
        const userData = activeUsers.get(socket.userId);
        if (userData && userData.workspaceId) {
          socket.leave(userData.workspaceId);
        }

        // Join new workspace room
        socket.join(workspaceId);
        activeUsers.set(socket.userId, {
          socketId: socket.id,
          workspaceId: workspaceId
        });

        console.log(`📍 ${socket.user.name} joined workspace: ${workspace.name}`);

        // Notify others in workspace
        socket.to(workspaceId).emit('user-joined', {
          userId: socket.userId,
          userName: socket.user.name,
          userAvatar: socket.user.avatar + socket.user.name
        });

        // Send current online users in workspace
        const onlineUsers = await getOnlineUsersInWorkspace(workspaceId);
        socket.emit('online-users', onlineUsers);

      } catch (error) {
        console.error('Join workspace error:', error);
        socket.emit('error', { message: 'Error joining workspace' });
      }
    });

    /**
     * Leave workspace room
     */
    socket.on('leave-workspace', (workspaceId) => {
      socket.leave(workspaceId);
      
      const userData = activeUsers.get(socket.userId);
      if (userData) {
        userData.workspaceId = null;
        activeUsers.set(socket.userId, userData);
      }

      // Notify others
      socket.to(workspaceId).emit('user-left', {
        userId: socket.userId,
        userName: socket.user.name
      });

      console.log(`📍 ${socket.user.name} left workspace`);
    });

    /**
     * Send message
     */
    socket.on('send-message', async (data) => {
      try {
        const { workspaceId, content, type = 'text' } = data;

        // Create message in database
        const message = await Message.create({
          workspace: workspaceId,
          sender: socket.userId,
          content,
          type
        });

        await message.populate('sender', 'name email avatar isOnline');

        // Broadcast to all users in workspace
        io.to(workspaceId).emit('new-message', message);

        console.log(`💬 Message sent in workspace ${workspaceId}`);

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Error sending message' });
      }
    });

    /**
     * Typing indicator
     */
    socket.on('typing-start', (workspaceId) => {
      if (!typingUsers.has(workspaceId)) {
        typingUsers.set(workspaceId, new Set());
      }
      typingUsers.get(workspaceId).add(socket.userId);

      socket.to(workspaceId).emit('user-typing', {
        userId: socket.userId,
        userName: socket.user.name
      });
    });

    socket.on('typing-stop', (workspaceId) => {
      if (typingUsers.has(workspaceId)) {
        typingUsers.get(workspaceId).delete(socket.userId);
      }

      socket.to(workspaceId).emit('user-stopped-typing', {
        userId: socket.userId
      });
    });

    /**
     * Document editing
     */
    socket.on('document-change', async (data) => {
      try {
        const { workspaceId, content, cursorPosition } = data;

        // Update document in database
        await Workspace.findByIdAndUpdate(workspaceId, {
          'document.content': content,
          'document.lastEditedBy': socket.userId,
          'document.lastEditedAt': new Date()
        });

        // Broadcast to others (not sender)
        socket.to(workspaceId).emit('document-updated', {
          content,
          editedBy: {
            userId: socket.userId,
            userName: socket.user.name
          },
          cursorPosition
        });

      } catch (error) {
        console.error('Document change error:', error);
        socket.emit('error', { message: 'Error updating document' });
      }
    });

    /**
     * Cursor position (for collaborative editing)
     */
    socket.on('cursor-move', (data) => {
      const { workspaceId, position } = data;
      
      socket.to(workspaceId).emit('cursor-update', {
        userId: socket.userId,
        userName: socket.user.name,
        position
      });
    });

    /**
     * Notification
     */
    socket.on('send-notification', (data) => {
      const { workspaceId, message, type } = data;
      
      io.to(workspaceId).emit('notification', {
        message,
        type,
        from: socket.user.name,
        timestamp: new Date()
      });
    });

    /**
     * Disconnect handler
     */
    socket.on('disconnect', async () => {
      console.log(`❌ User disconnected: ${socket.user.name}`);

      // Update user online status
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastSeen: new Date()
      });

      // Get user's workspace before removing
      const userData = activeUsers.get(socket.userId);
      if (userData && userData.workspaceId) {
        // Notify others in workspace
        socket.to(userData.workspaceId).emit('user-left', {
          userId: socket.userId,
          userName: socket.user.name
        });

        // Remove from typing users
        if (typingUsers.has(userData.workspaceId)) {
          typingUsers.get(userData.workspaceId).delete(socket.userId);
        }
      }

      // Remove from active users
      activeUsers.delete(socket.userId);
    });
  });

  return io;
};

/**
 * Get online users in a workspace
 * @param {string} workspaceId - Workspace ID
 * @returns {Array} - Array of online user objects
 */
const getOnlineUsersInWorkspace = async (workspaceId) => {
  const workspace = await Workspace.findById(workspaceId)
    .populate('members.user', 'name email avatar isOnline');

  if (!workspace) return [];

  return workspace.members
    .filter(member => member.user.isOnline)
    .map(member => ({
      userId: member.user._id,
      userName: member.user.name,
      userAvatar: member.user.avatar + member.user.name
    }));
};

module.exports = {
  initializeSocket,
  activeUsers,
  typingUsers
};


