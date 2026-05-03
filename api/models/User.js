const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Schema
 * Stores user authentication and profile information
 */
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password by default in queries
  },
  avatar: {
    type: String,
    default: 'https://ui-avatars.com/api/?background=random&name='
  },
  workspaces: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace'
  }],
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

/**
 * Pre-save middleware to hash password before saving
 */
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Method to compare password for login
 * @param {string} candidatePassword - Password to compare
 * @returns {Promise<boolean>} - True if password matches
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

/**
 * Method to get public profile (without sensitive data)
 * @returns {Object} - Public user profile
 */
userSchema.methods.getPublicProfile = function() {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar + this.name,
    isOnline: this.isOnline,
    lastSeen: this.lastSeen,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('User', userSchema);

// Made with Bob
