import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../utils/prisma.js';
import redis from '../utils/redis.js';
import { sendPasswordResetConfirmationEmail, sendEmailUsingTemplate } from '../utils/email.js';
import { USER_ROLES } from '../utils/constants.js';
import { t } from '../utils/i18n.js';


const router = express.Router();

// Check username availability
router.get('/check-username', async (req, res) => {
  try {
    const { username } = req.query;
    const language = req.currentLanguage;

    if (!username) {
      return res.status(400).json({
        success: false,
        available: false,
        message: t(language, "response_messages.username_is_required")
      });
    }

    // Check if username exists
    const existingUser = await prisma.users.findFirst({
      where: { username }
    });

    res.json({
      success: true,
      available: !existingUser,
      message: existingUser ? t(language, "response_messages.username_already_taken") : t(language, "response_messages.username_available")
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
      full_name,
      username,
      email,
      password,
      phone_number,
      role_id, 
      address_1,
      address_2,
      city_id,
      state_id,
      country_id,
      zipcode,
      termsAccepted,
      language
    } = req.body;

    const lang = req.currentLanguage;
    // Validate required fields
    if (!full_name || !username || !password) {
      return res.status(400).json({
        success: false,
        message: t(lang, "response_messages.full_name_username_password_required")
      });
    }

    // Trim username and password for consistency
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    // Check if user already exists (by username)
    const existingUser = await prisma.users.findFirst({
      where: { username: trimmedUsername }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: t(lang, "response_messages.user_with_this_username_already_exists")
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(trimmedPassword, saltRounds);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // 24 hours expiry

    // Create user (store username and email)
    const newUser = await prisma.users.create({
      data: {
        full_name,
        username: trimmedUsername,
        email,
        password: hashedPassword,
        phone_number,
        role_id,
        address_1,
        address_2,
        city_id,
        state_id,
        country_id,
        zipcode,
        email_verified: 0,
        email_verify_token: verificationToken,
        email_verify_expires: tokenExpiry,
        status: 0, // Inactive until email verified
        terms_accepted: termsAccepted || 0,
        language: language || 'en'
      },
      select: {
        id: true,
        full_name: true,
        username: true,
        email: true,
        phone_number: true,
        role_id: true,
        status: true,
        email_verified: true,
        created_at: true,
        language: true
      }
    });

    if(newUser.email) {
      // Send verification email for all users (don't block registration if email fails)
      const templateData = {
        full_name: newUser.full_name,
        company_name: 'WeShare Energy',
        verify_link: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`,
      }

      sendEmailUsingTemplate({
        to: newUser.email,
        templateSlug: 'verify_email_after_sign_up',
        templateData,
        language: newUser.language || 'en'
      })
        .then((result) => {
          if (result.success) {
            console.log(`✅ Verification email sent to ${newUser.email}`);
          } else {
            console.warn(`⚠️ Could not send verification email: ${result.error}`);
          }
        })
        .catch((error) => {
          console.error('❌ Failed to send verification email:', error.message);
        });
    }

    res.status(201).json({
      success: true,
      message: t(lang, "response_messages.user_registered_successfully"),
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
    const language = req.currentLanguage;
    console.log(language);
    // Check if body exists
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: t(language, "response_messages.request_body_is_required")
      });
    }

    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: t(language, "response_messages.username_and_password_are_required")
      });
    }

    // Find user by username (trim username for consistency)
    const user = await prisma.users.findFirst({
      where: { username: username.trim() }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: t(language, "response_messages.invalid_username_or_password")
      });
    }

    // Check password (trim password for consistency with registration and reset)
    const isPasswordValid = await bcrypt.compare(password.trim(), user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: t(language, "response_messages.invalid_user_or_password")
      });
    }

    // Check if user is active
    if (user.status === 0) {
      return res.status(403).json({
        success: false,
        message: t(language, "response_messages.account_not_activated")
      });
    }

    // Check if email is verified (only for offtakers and investors - role_id 2 or 3)
    if ((user.role_id === 2 || user.role_id === 3) && user.email_verified === 0) {
      return res.status(403).json({
        success: false,
        message: t(language, "response_messages.please_verify_your_email_address_before_logging_in"),
        emailNotVerified: true,
        email: user.email
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role_id 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // 🔑 Redis session
    const rememberMe = req.body.rememberMe === true;
    const sessionTTL = rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 2; // 7 days /  2 hours

    // Hash token so raw JWT is never stored
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const redisKey = `session:${user.id}:${tokenHash}`;

    await redis.set(
      redisKey,
      JSON.stringify({
        userId: user.id,
        role: user.userRole,
        loginAt: Date.now()
      }),
      'EX',
      sessionTTL
    );

    // Get user's role permissions
    const rolePermissions = await prisma.roles_permissions.findMany({
      where: { role_id: user.role_id }
    });

    // Build permissions map: { module: { capability: boolean } }
    const permissions = {};
    rolePermissions.forEach(p => {
      if (!permissions[p.module]) {
        permissions[p.module] = {};
      }
      permissions[p.module][p.key] = p.value === 1;
    });

    const { password: _, ...userWithoutPassword } = user;
    res.json({
      success: true,
      message: t(language, "response_messages.login_successful"),
      data: {
        user: {
          ...userWithoutPassword,
          permissions
        },
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
      return res.status(401).json({ success: false });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    

    // 🔐 Redis validation
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const redisKey = `session:${decoded.userId}:${tokenHash}`;
    
    const session = await redis.get(redisKey);
    
    if (!session) {
      return res.status(401).json({
        success: false,
        message: t(language, "response_messages.session_expired")
      });
    }

    // Verify token
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user data
    const user = await prisma.users.findFirst({
      where: { id: decoded.userId },
      select: {
        id: true,
        full_name: true,
        username: true,
        email: true,
        phone_number: true,
        role_id: true,
        address_1: true,
        address_2: true,
        city_id: true,
        state_id: true,
        country_id: true,
        zipcode: true,
        status: true,
        user_image: true,
        language: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: t(language, "response_messages.user_not_found")
      });
    }

    // Get user's role permissions
    const rolePermissions = await prisma.roles_permissions.findMany({
      where: { role_id: user.role_id }
    });

    // Build permissions map: { module: { capability: boolean } }
    const permissions = {};
    rolePermissions.forEach(p => {
      if (!permissions[p.module]) {
        permissions[p.module] = {};
      }
      permissions[p.module][p.key] = p.value === 1;
    });

    res.json({
      success: true,
      data: {
        ...user,
        permissions
      }
    });


  } catch (error) {
    console.error('Get profile error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
});
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.json({ success: true });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const redisKey = `session:${decoded.userId}:${tokenHash}`;
    await redis.del(redisKey);

    res.json({ success: true });
  } catch {
    res.json({ success: true });
  }
});

// Forgot password - send reset link
router.post('/forgot-password', async (req, res) => {
  try {
    const { username } = req.body;
    const language = req.currentLanguage;
    // Validate username
    if (!username) {
      return res.status(400).json({
        success: false,
        message: t(language, "response_messages.username_is_required")
      });
    }

    // Check if user exists with this username (case-insensitive)
    const user = await prisma.users.findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive'
        }
      }
    });

    // If user doesn't exist, return generic error (don't reveal if user exists)
    if (!user) {
      return res.status(200).json({
        success: true,
        message: t(language, "response_messages.if_this_username_exists_a_password_reset_link_has_been_sent_to_the_registered_email_address")
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
    await prisma.password_reset_tokens.deleteMany({
      where: { username: user.username }
    });

    // Create new reset token
    await prisma.password_reset_tokens.create({
      data: {
        username: user.username,
        token: hashedToken,
        expires_at: expiresAt,
        used: false
      }
    });

    if(user.email) {  
      const templateData = {
        full_name: user.full_name,
        user_email: user.email,
        company_name: 'WeShare Energy',
        reset_password_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`,
      };

      sendEmailUsingTemplate({
        to: user.email,
        templateSlug: 'reset_password_for_user',
        templateData,
        language: user.language || 'en'
      })
        .then((result) => {
          if (result.success) {
            console.log(`✅ Reset password email sent to ${user.email}`);
          } else {
            console.warn(`⚠️ Could not send reset password email: ${result.error}`);
          }
        })
        .catch((error) => {
          console.error('❌ Failed to send reset password email:', error.message);
        });
    }

    res.json({
      success: true,
      message: t(language, "response_messages.password_reset_link_has_been_sent_to_your_registered_email_address_please_check_your_inbox")
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
    const language = req.currentLanguage;

    // Validate input
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: t(language, "response_messages.token_and_new_password_are_required")
      });
    }

    // Validate password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: t(language, "response_messages.password_must_be_at_least_6_characters_long")
      });
    }

    // Hash the token to match stored version
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find valid token
    const resetToken = await prisma.password_reset_tokens.findFirst({
      where: {
        token: hashedToken,
        used: false,
        expires_at: {
          gt: new Date() // Token not expired
        }
      }
    });

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        message: t(language, "response_messages.invalid_or_expired_reset_token_please_request_a_new_password_reset_link")
      });
    }

    // Find user by email
    const user = await prisma.users.findFirst({
      where: { username: resetToken.username }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: t(language, "response_messages.user_not_found")
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    await prisma.users.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    // Mark token as used
    await prisma.password_reset_tokens.update({
      where: { id: resetToken.id },
      data: { used: true }
    });

    // Send confirmation email
    await sendPasswordResetConfirmationEmail(user.email);

    res.json({
      success: true,
      message: t(language, "response_messages.password_has_been_reset_successfully_you_can_now_login_with_your_new_password")
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
    const language = req.currentLanguage;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: t(language, "response_messages.token_is_required")
      });
    }

    // Hash the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Check if token exists and is valid
    const resetToken = await prisma.password_reset_tokens.findFirst({
      where: {
        token: hashedToken,
        used: false,
        expires_at: {
          gt: new Date()
        }
      }
    });

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        message: t(language, "response_messages.invalid_or_expired_reset_token")
      });
    }

    // Find user by email to get username
    const user = await prisma.users.findFirst({
      where: { username: resetToken.username }
    });

    res.json({
      success: true,
      message: 'Token is valid',
      username: user ? user.username : null,
      email: resetToken.email // Keep email for backwards compatibility
    });

  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify email with token
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const language = req.currentLanguage;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: t(language, "response_messages.verification_token_is_required")
      });
    }

    // Find user with this token
    const user = await prisma.users.findFirst({
      where: {
        email_verify_token: token,
        email_verified: 0
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: t(language, "response_messages.invalid_or_expired_verification_token")
      });
    }

    // Check if token is expired
    if (user.email_verify_expires && new Date() > user.email_verify_expires) {
      return res.status(400).json({
        success: false,
        message: t(language, "response_messages.verification_token_has_expired_please_request_a_new_one"),
        language: user.language || 'en'
      });
    }

    // Update user - mark email as verified
    await prisma.users.update({
      where: { id: user.id },
      data: {
        status : 1, // Activate account upon email verification
        email_verified: 1,
        email_verified_at: new Date(),
        email_verify_token: null,
        email_verify_expires: null
      }
    });

    if (user.email) {
      if (user.role_id === USER_ROLES.OFFTAKER) {
        // const verifyLink = `${process.env.FRONTEND_URL || ''}/verify-email/${token}`;
        const loginUrl = `${process.env.FRONTEND_URL || ''}/offtaker/login`;

        const templateData = {
          full_name: user.full_name,
          user_email: user.email,
          account_type: 'Offtaker',
          current_date: new Date().toLocaleDateString(),
          // verify_link: verifyLink,
          login_url: loginUrl,
        };

        sendEmailUsingTemplate({
          to: user.email,
          templateSlug: 'email_to_offtaker_on_sign_up',
          templateData,
          language: user.language || 'en'
        })
          .then((result) => {
            if (result.success) {
              console.log(`Welcome email sent to ${user.email}`);
            } else {
              console.warn(`Could not send welcome email: ${result.error}`);
            }
          })
          .catch((error) => {
            console.error('Failed to send welcome email:', error.message);
          });
      } else if (user.role_id === USER_ROLES.INVESTOR) {
        const loginUrl = `${process.env.FRONTEND_URL || ''}/investor/login`;

        const templateData = {
          full_name: user.full_name,
          user_email: user.email,
          current_date: new Date().toLocaleDateString(),
          login_url: loginUrl,
        };

        sendEmailUsingTemplate({
          to: user.email,
          templateSlug: 'email_to_investor_on_sign_up',
          templateData,
          language: user.language || 'en'
        })
          .then((result) => {
            if (result.success) {
              console.log(`Welcome email sent to ${user.email}`);
            } else {
              console.warn(`Could not send welcome email: ${result.error}`);
            }
          })
          .catch((error) => {
            console.error('Failed to send welcome email:', error.message);
          });
      }
    }

    res.json({
      success: true,
      message: t(language, "response_messages.email_verified_successfully_you_can_now_login"),
      language: user.language || 'en'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during email verification'
    });
  }
});

// Resend verification email
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    const language = req.currentLanguage;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: t(language, "response_messages.email_is_required")
      });
    }

    // Find user by email
    const user = await prisma.users.findFirst({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: t(language, "response_messages.user_not_found")
      });
    }

    // Check if already verified
    if (user.email_verified === 1) {
      return res.status(400).json({
        success: false,
        message: t(language, "response_messages.email_is_already_verified")
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // 24 hours expiry

    // Update user with new token
    await prisma.users.update({
      where: { id: user.id },
      data: {
        email_verify_token: verificationToken,
        email_verify_expires: tokenExpiry
      }
    });

    if(user.email) {
      // Send verification email for all users (don't block registration if email fails)
      const templateData = {
        full_name: user.full_name,
        company_name: 'WeShare Energy',
        verify_link: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`,
      }

      sendEmailUsingTemplate({
        to: user.email,
        templateSlug: 'verify_email_after_sign_up',
        templateData,
        language: user.language || 'en'
      })
        .then((result) => {
          if (result.success) {
            console.log(`✅ Verification email sent to ${user.email}`);
          } else {
            console.warn(`⚠️ Could not send verification email: ${result.error}`);
          }
        })
        .catch((error) => {
          console.error('❌ Failed to send verification email:', error.message);
        });
    }

    res.json({
      success: true,
      message: t(language, "response_messages.verification_email_sent_successfully_please_check_your_inbox"),
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification email'
    });
  }
});

export default router;