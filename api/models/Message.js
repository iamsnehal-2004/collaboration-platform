const mongoose = require('mongoose');

/**
 * Message Schema
 * Stores chat messages within workspaces
 */
const messageSchema = new mongoose.Schema({
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: [true, 'Message must belong to a workspace']
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Message must have a sender']
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  type: {
    type: String,
    enum: ['text', 'file', 'system'],
    default: 'text'
  },
  fileUrl: {
    type: String,
    default: null
  },
  fileName: {
    type: String,
    default: null
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

/**
 * Index for efficient querying
 * - Find messages by workspace
 * - Sort by creation time
 */
messageSchema.index({ workspace: 1, createdAt: -1 });

/**
 * Method to mark message as read by a user
 * @param {string} userId - User ID who read the message
 */
messageSchema.methods.markAsRead = function(userId) {
  const alreadyRead = this.readBy.some(
    read => read.user.toString() === userId.toString()
  );
  
  if (!alreadyRead) {
    this.readBy.push({
      user: userId,
      readAt: new Date()
    });
  }
};

/**
 * Static method to get recent messages for a workspace
 * @param {string} workspaceId - Workspace ID
 * @param {number} limit - Number of messages to retrieve
 * @returns {Promise<Array>} - Array of messages
 */
messageSchema.statics.getRecentMessages = function(workspaceId, limit = 50) {
  return this.find({ workspace: workspaceId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('sender', 'name email avatar isOnline')
    .exec();
};

/**
 * Static method to create a system message
 * @param {string} workspaceId - Workspace ID
 * @param {string} content - Message content
 * @returns {Promise<Object>} - Created message
 */
messageSchema.statics.createSystemMessage = function(workspaceId, content) {
  return this.create({
    workspace: workspaceId,
    sender: null,
    content: content,
    type: 'system'
  });
};

module.exports = mongoose.model('Message', messageSchema);

// Made with Bob
