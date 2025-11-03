import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../utils/prisma.js';
import { sendPasswordResetEmail, sendPasswordResetConfirmationEmail } from '../utils/email.js';

const router = express.Router();

// Check username availability
router.get('/check-username', async (req, res) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({
        success: false,
        available: false,
        message: 'Username is required'
      });
    }

    // Check if username exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    res.json({
      success: true,
      available: !existingUser,
      message: existingUser ? 'Username already taken' : 'Username available'
    });

  } catch (error) {
    console.error('Error checking username:', error);
    res.status(500).json({
      success: false,
      available: false,
      message: 'Error checking username'
    });
  }
});

// Register new user
router.post('/register', async (req, res) => {
  try {
    const {
      fullName,
      username,
      email,
      password,
      phoneNumber,
      userRole, 
      address1,
      address2,
      city,
      state,
      country,
      zipcode,
      termsAccepted
    } = req.body;

    // Validate required fields
    if (!fullName || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, username, and password are required'
      });
    }

    // Check if user already exists (by username)
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this username already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user (store username and email)
    const newUser = await prisma.user.create({
      data: {
        fullName,
        username,
        email,
        password: hashedPassword,
        phoneNumber,
        userRole,
        address1,
        address2,
        city,
        state,
        country,
        zipcode,
        status: 0, // Default inactive status
        terms_accepted: termsAccepted || 0
      },
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        phoneNumber: true,
        userRole: true,
        status: true,
        createdAt: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: newUser
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    // Debug logging
    // console.log('Request headers:', req.headers);
    // console.log('Request body:', req.body);
    
    // Check if body exists
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: 'Request body is required'
      });
    }
    
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid user or password'
      });
    }

    // Check if user is active
    if (user.status === 0) {
      return res.status(403).json({
        success: false,
        message: 'Account is not activated. Please contact administrator.'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        username: user.username,
        role: user.userRole 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Return user data (excluding password)
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
});

// Get current user profile
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        phoneNumber: true,
        userRole: true,
        address1: true,
        address2: true,
        city: true,
        state: true,
        country: true,
        zipcode: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
});

// Forgot password - send reset link
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user exists with this email
    const user = await prisma.user.findFirst({
      where: { email }
    });

    // If user doesn't exist, return error
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address.'
      });
    }

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash the token before storing
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expiration time (1 hour from now)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Delete any existing tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email }
    });

    // Create new reset token
    await prisma.passwordResetToken.create({
      data: {
        email,
        token: hashedToken,
        expiresAt,
        used: false
      }
    });

    // Send email with reset link
    const emailResult = await sendPasswordResetEmail(email, resetToken);

    if (!emailResult.success) {
      console.error('Failed to send email:', emailResult.error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again later.'
      });
    }

    res.json({
      success: true,
      message: 'Password reset link has been sent to your email. Please check your inbox.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
});

// Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Validate input
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    // Validate password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Hash the token to match stored version
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find valid token
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token: hashedToken,
        used: false,
        expiresAt: {
          gt: new Date() // Token not expired
        }
      }
    });

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token. Please request a new password reset link.'
      });
    }

    // Find user by email
    const user = await prisma.user.findFirst({
      where: { email: resetToken.email }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true }
    });

    // Send confirmation email
    await sendPasswordResetConfirmationEmail(user.email);

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
});

// Verify reset token (optional - for checking if token is valid before showing form)
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    // Hash the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Check if token exists and is valid
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token: hashedToken,
        used: false,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    res.json({
      success: true,
      message: 'Token is valid',
      email: resetToken.email // Optionally return email to show in form
    });

  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;