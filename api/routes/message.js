const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Workspace = require('../models/Workspace');
const { authenticate } = require('../middleware/auth');

/**
 * Message Routes
 * Handles chat messages within workspaces
 */

/**
 * @route   GET /api/message/:workspaceId
 * @desc    Get all messages for a workspace
 * @access  Private
 */
router.get('/:workspaceId', authenticate, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { limit = 50, before } = req.query;

    // Check if workspace exists and user is a member
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    if (!workspace.isMember(req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this workspace'
      });
    }

    // Build query
    const query = { workspace: workspaceId };
    
    // If 'before' timestamp is provided, get messages before that time
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    // Get messages
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('sender', 'name email avatar isOnline')
      .populate('readBy.user', 'name email');

    // Reverse to get chronological order
    messages.reverse();

    res.status(200).json({
      success: true,
      data: { messages }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/message/:workspaceId
 * @desc    Send a message to a workspace
 * @access  Private
 */
router.post('/:workspaceId', authenticate, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { content, type = 'text' } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    // Check if workspace exists and user is a member
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    if (!workspace.isMember(req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this workspace'
      });
    }

    // Create message
    const message = await Message.create({
      workspace: workspaceId,
      sender: req.userId,
      content: content.trim(),
      type
    });

    // Populate sender info
    await message.populate('sender', 'name email avatar isOnline');

    // Update workspace's updatedAt
    workspace.updatedAt = new Date();
    await workspace.save();

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message }
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/message/:messageId
 * @desc    Edit a message
 * @access  Private
 */
router.put('/:messageId', authenticate, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own messages'
      });
    }

    // Update message
    message.content = content.trim();
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    await message.populate('sender', 'name email avatar isOnline');

    res.status(200).json({
      success: true,
      message: 'Message updated successfully',
      data: { message }
    });

  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error editing message',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/message/:messageId
 * @desc    Delete a message
 * @access  Private
 */
router.delete('/:messageId', authenticate, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is the sender or workspace admin
    const workspace = await Workspace.findById(message.workspace);
    const isAdmin = workspace.isAdmin(req.userId);
    const isSender = message.sender.toString() === req.userId.toString();

    if (!isSender && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages or be an admin'
      });
    }

    await message.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting message',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/message/:messageId/read
 * @desc    Mark message as read
 * @access  Private
 */
router.post('/:messageId/read', authenticate, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Mark as read
    message.markAsRead(req.userId);
    await message.save();

    res.status(200).json({
      success: true,
      message: 'Message marked as read'
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking message as read',
      error: error.message
    });
  }
});

module.exports = router;


