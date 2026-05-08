const jwt = require('jsonwebtoken');

/**
 * JWT Utility Functions
 * Handles token generation and verification for authentication
 */

/**
 * Generate JWT token for user authentication
 * @param {Object} payload - Data to encode in token (usually user ID)
 * @param {string} expiresIn - Token expiration time (default: 7 days)
 * @returns {string} - JWT token
 */
const generateToken = (payload, expiresIn = '7d') => {
  try {
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn }
    );
    return token;
  } catch (error) {
    console.error('Error generating token:', error);
    throw new Error('Token generation failed');
  }
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} - Decoded token payload
 * @throws {Error} - If token is invalid or expired
 */
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed');
    }
  }
};

/**
 * Generate refresh token (longer expiration)
 * @param {Object} payload - Data to encode in token
 * @returns {string} - Refresh token
 */
const generateRefreshToken = (payload) => {
  return generateToken(payload, '30d');
};

/**
 * Decode token without verification (for debugging)
 * @param {string} token - JWT token to decode
 * @returns {Object} - Decoded token payload
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
  generateRefreshToken,
  decodeToken
};


