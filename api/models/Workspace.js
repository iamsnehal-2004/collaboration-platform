const mongoose = require('mongoose');

/**
 * Workspace Schema
 * Represents a collaboration workspace where users can work together
 */
const workspaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Workspace name is required'],
    trim: true,
    minlength: [3, 'Workspace name must be at least 3 characters'],
    maxlength: [100, 'Workspace name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Workspace must have an owner']
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  inviteCode: {
    type: String,
    unique: true,
    required: true
  },
  document: {
    content: {
      type: String,
      default: '# Welcome to the collaborative document!\n\nStart typing here...'
    },
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lastEditedAt: {
      type: Date,
      default: Date.now
    }
  },
  files: [{
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

/**
 * Generate a unique invite code for the workspace
 */
workspaceSchema.methods.generateInviteCode = function() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

/**
 * Check if a user is a member of the workspace
 * @param {string} userId - User ID to check
 * @returns {boolean} - True if user is a member
 */
workspaceSchema.methods.isMember = function(userId) {
  return this.members.some(member => {
    // Handle both populated and non-populated user references
    const memberUserId = member.user._id || member.user;
    return memberUserId.toString() === userId.toString();
  });
};

/**
 * Check if a user is an admin of the workspace
 * @param {string} userId - User ID to check
 * @returns {boolean} - True if user is an admin
 */
workspaceSchema.methods.isAdmin = function(userId) {
  const member = this.members.find(m => {
    // Handle both populated and non-populated user references
    const memberUserId = m.user._id || m.user;
    return memberUserId.toString() === userId.toString();
  });
  return member && member.role === 'admin';
};

/**
 * Add a member to the workspace
 * @param {string} userId - User ID to add
 * @param {string} role - Role of the user (admin/member)
 */
workspaceSchema.methods.addMember = function(userId, role = 'member') {
  if (!this.isMember(userId)) {
    this.members.push({
      user: userId,
      role: role,
      joinedAt: new Date()
    });
  }
};

/**
 * Pre-save middleware to generate invite code if not exists
 */
workspaceSchema.pre('save', function(next) {
  if (!this.inviteCode) {
    this.inviteCode = this.generateInviteCode();
  }
  next();
});

module.exports = mongoose.model('Workspace', workspaceSchema);


