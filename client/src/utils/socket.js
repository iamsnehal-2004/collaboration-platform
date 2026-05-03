import { io } from 'socket.io-client';

/**
 * Socket.IO Client Utility
 * Manages WebSocket connection for real-time features
 */

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

/**
 * Initialize socket connection
 * @param {string} token - JWT authentication token
 * @returns {Object} - Socket instance
 */
export const initializeSocket = (token) => {
  if (socket && socket.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: {
      token: token
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
  });

  // Connection event handlers
  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  return socket;
};

/**
 * Get current socket instance
 * @returns {Object|null} - Socket instance or null
 */
export const getSocket = () => {
  return socket;
};

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('🔌 Socket disconnected');
  }
};

/**
 * Join a workspace room
 * @param {string} workspaceId - Workspace ID to join
 */
export const joinWorkspace = (workspaceId) => {
  if (socket && socket.connected) {
    socket.emit('join-workspace', workspaceId);
  }
};

/**
 * Leave a workspace room
 * @param {string} workspaceId - Workspace ID to leave
 */
export const leaveWorkspace = (workspaceId) => {
  if (socket && socket.connected) {
    socket.emit('leave-workspace', workspaceId);
  }
};

/**
 * Send a message
 * @param {string} workspaceId - Workspace ID
 * @param {string} content - Message content
 * @param {string} type - Message type (text/file/system)
 */
export const sendMessage = (workspaceId, content, type = 'text') => {
  if (socket && socket.connected) {
    socket.emit('send-message', { workspaceId, content, type });
  }
};

/**
 * Start typing indicator
 * @param {string} workspaceId - Workspace ID
 */
export const startTyping = (workspaceId) => {
  if (socket && socket.connected) {
    socket.emit('typing-start', workspaceId);
  }
};

/**
 * Stop typing indicator
 * @param {string} workspaceId - Workspace ID
 */
export const stopTyping = (workspaceId) => {
  if (socket && socket.connected) {
    socket.emit('typing-stop', workspaceId);
  }
};

/**
 * Update document content
 * @param {string} workspaceId - Workspace ID
 * @param {string} content - Document content
 * @param {number} cursorPosition - Cursor position
 */
export const updateDocument = (workspaceId, content, cursorPosition) => {
  if (socket && socket.connected) {
    socket.emit('document-change', { workspaceId, content, cursorPosition });
  }
};

/**
 * Send cursor position
 * @param {string} workspaceId - Workspace ID
 * @param {number} position - Cursor position
 */
export const sendCursorPosition = (workspaceId, position) => {
  if (socket && socket.connected) {
    socket.emit('cursor-move', { workspaceId, position });
  }
};

/**
 * Send notification
 * @param {string} workspaceId - Workspace ID
 * @param {string} message - Notification message
 * @param {string} type - Notification type
 */
export const sendNotification = (workspaceId, message, type = 'info') => {
  if (socket && socket.connected) {
    socket.emit('send-notification', { workspaceId, message, type });
  }
};

/**
 * Listen to socket events
 * @param {string} event - Event name
 * @param {Function} callback - Callback function
 */
export const onSocketEvent = (event, callback) => {
  if (socket) {
    socket.on(event, callback);
  }
};

/**
 * Remove socket event listener
 * @param {string} event - Event name
 * @param {Function} callback - Callback function
 */
export const offSocketEvent = (event, callback) => {
  if (socket) {
    socket.off(event, callback);
  }
};

export default {
  initializeSocket,
  getSocket,
  disconnectSocket,
  joinWorkspace,
  leaveWorkspace,
  sendMessage,
  startTyping,
  stopTyping,
  updateDocument,
  sendCursorPosition,
  sendNotification,
  onSocketEvent,
  offSocketEvent
};

// Made with Bob
