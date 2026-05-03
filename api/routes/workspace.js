const express = require('express');
const router = express.Router();
const Workspace = require('../models/Workspace');
const User = require('../models/User');
const Message = require('../models/Message');
const { authenticate } = require('../middleware/auth');

/**
 * Workspace Routes
 * Handles workspace creation, joining, and management
 */

/**
 * Generate a unique 6-character invite code
 * @returns {String} Unique invite code
 */
const generateInviteCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * @route   POST /api/workspace
 * @desc    Create a new workspace
 * @access  Private
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Workspace name is required'
      });
    }

    // Generate unique invite code
    let inviteCode;
    let isUnique = false;
    while (!isUnique) {
      inviteCode = generateInviteCode();
      const existing = await Workspace.findOne({ inviteCode });
      if (!existing) isUnique = true;
    }

    // Create workspace
    const workspace = await Workspace.create({
      name,
      description: description || '',
      owner: req.userId,
      inviteCode,
      members: [{
        user: req.userId,
        role: 'admin',
        joinedAt: new Date()
      }]
    });

    // Add workspace to user's workspaces
    await User.findByIdAndUpdate(req.userId, {
      $push: { workspaces: workspace._id }
    });

    // Create system message
    await Message.create({
      workspace: workspace._id,
      sender: req.userId,
      content: `${req.user.name} created the workspace`,
      type: 'system'
    });

    const populatedWorkspace = await Workspace.findById(workspace._id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar isOnline');

    res.status(201).json({
      success: true,
      message: 'Workspace created successfully',
      data: { workspace: populatedWorkspace }
    });

  } catch (error) {
    console.error('Create workspace error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating workspace',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/workspace
 * @desc    Get all workspaces for current user
 * @access  Private
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      'members.user': req.userId,
      isActive: true
    })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar isOnline')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: { workspaces }
    });

  } catch (error) {
    console.error('Get workspaces error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching workspaces',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/workspace/:id
 * @desc    Get workspace by ID
 * @access  Private
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar isOnline')
      .populate('document.lastEditedBy', 'name email');

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    // Debug logging
    console.log('🔍 Debug - req.userId:', req.userId);
    console.log('🔍 Debug - req.userId type:', typeof req.userId);
    console.log('🔍 Debug - workspace.members:', workspace.members.map(m => ({ user: m.user, type: typeof m.user })));

    // Check if user is a member
    if (!workspace.isMember(req.userId)) {
      console.log('❌ User is NOT a member');
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this workspace'
      });
    }
    
    console.log('✅ User IS a member');

    res.status(200).json({
      success: true,
      data: { workspace }
    });

  } catch (error) {
    console.error('Get workspace error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching workspace',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/workspace/join
 * @desc    Join workspace using invite code
 * @access  Private
 */
router.post('/join', authenticate, async (req, res) => {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({
        success: false,
        message: 'Invite code is required'
      });
    }

    const workspace = await Workspace.findOne({ inviteCode: inviteCode.toUpperCase() });

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Invalid invite code'
      });
    }

    // Check if user is already a member
    if (workspace.isMember(req.userId)) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this workspace'
      });
    }

    // Add user to workspace
    workspace.addMember(req.userId, 'member');
    await workspace.save();

    // Add workspace to user's workspaces
    await User.findByIdAndUpdate(req.userId, {
      $push: { workspaces: workspace._id }
    });

    // Create system message
    await Message.create({
      workspace: workspace._id,
      sender: req.userId,
      content: `${req.user.name} joined the workspace`,
      type: 'system'
    });

    const populatedWorkspace = await Workspace.findById(workspace._id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar isOnline');

    res.status(200).json({
      success: true,
      message: 'Joined workspace successfully',
      data: { workspace: populatedWorkspace }
    });

  } catch (error) {
    console.error('Join workspace error:', error);
    res.status(500).json({
      success: false,
      message: 'Error joining workspace',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/workspace/:id
 * @desc    Update workspace details
 * @access  Private (Admin only)
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, description } = req.body;
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    // Check if user is admin
    if (!workspace.isAdmin(req.userId) && workspace.owner.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can update workspace details'
      });
    }

    if (name) workspace.name = name;
    if (description !== undefined) workspace.description = description;

    await workspace.save();

    const populatedWorkspace = await Workspace.findById(workspace._id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar isOnline');

    res.status(200).json({
      success: true,
      message: 'Workspace updated successfully',
      data: { workspace: populatedWorkspace }
    });

  } catch (error) {
    console.error('Update workspace error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating workspace',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/workspace/:id/document
 * @desc    Update workspace document
 * @access  Private
 */
router.put('/:id/document', authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    // Check if user is a member
    if (!workspace.isMember(req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this workspace'
      });
    }

    workspace.document.content = content;
    workspace.document.lastEditedBy = req.userId;
    workspace.document.lastEditedAt = new Date();

    await workspace.save();

    res.status(200).json({
      success: true,
      message: 'Document updated successfully',
      data: { document: workspace.document }
    });

  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating document',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/workspace/:id/leave
 * @desc    Leave workspace
 * @access  Private
 */
router.delete('/:id/leave', authenticate, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    // Check if user is owner
    if (workspace.owner.toString() === req.userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Owner cannot leave workspace. Transfer ownership or delete workspace.'
      });
    }

    // Remove user from workspace
    workspace.members = workspace.members.filter(
      member => member.user.toString() !== req.userId.toString()
    );
    await workspace.save();

    // Remove workspace from user's workspaces
    await User.findByIdAndUpdate(req.userId, {
      $pull: { workspaces: workspace._id }
    });

    // Create system message
    await Message.create({
      workspace: workspace._id,
      sender: req.userId,
      content: `${req.user.name} left the workspace`,
      type: 'system'
    });

    res.status(200).json({
      success: true,
      message: 'Left workspace successfully'
    });

  } catch (error) {
    console.error('Leave workspace error:', error);
    res.status(500).json({
      success: false,
      message: 'Error leaving workspace',
      error: error.message
    });
  }
});

module.exports = router;

// Made with Bob
