import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import { sendEmailUsingTemplate } from '../utils/email.js';
import { getUsersByRole } from '../utils/constants.js';
import { ROLES } from '../../src/constants/roles.js';
import { t } from '../utils/i18n.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const {
      fullName,
      email,
      phoneNumber,
      countryId,
      stateId,
      cityId,
      address,
      subject,
      message,
      created_by
    } = req.body || {}
    const language = req.currentLanguage;

    // Basic validation
    if (!fullName || !email || !message) {
      return res.status(400).json({
        success: false,
        message: t(language, "response_messages.fullName_email_message_required")
      })
    }

    const payload = {
      full_name: String(fullName).trim(),
      email: String(email).trim(),
      phone_number: phoneNumber ? String(phoneNumber).trim() : null,
      ...(countryId && {
        countries: {
          connect: { id: Number(countryId) }
        }
      }),
      ...(stateId && {
        states: {
          connect: { id: Number(stateId) }
        }
      }),
      ...(cityId && {
        cities: {
          connect: { id: Number(cityId) }
        }
      }),
      address: address ? String(address).trim() : null,
      subject: subject ? String(subject).trim() : null,
      message: String(message).trim()
    }

    const record = await prisma.lease_requests.create({
      data: payload
    })


    if (record) {
      const templateData = {
        full_name: payload.full_name,
        user_email: payload.email,
        user_phone: payload.phone_number,
        subject: payload.subject,
        message: payload.message,
        company_name: 'WeShare Energy',
        current_date: new Date().toLocaleDateString(),
      };

      // get admin 
     const user = await prisma.users.findFirst({
      where: {
        role_id: ROLES.SUPER_ADMIN,
        is_deleted: 0
      }
     })

      sendEmailUsingTemplate({
        to: user.email,
        templateSlug: 'lease_request_generate',
        templateData,
        language: user.language || 'vi',
      }).then((result) => {
        if (result.success) {
          console.log(`Lease request email sent to ${email}`);
        } else {
          console.warn(`Could not send lease request email: ${result.error}`);
        }
      }).catch((error) => {
          console.error('Failed to send lease request email:', error.message);
      });
    }

    return res.status(201).json({
      success: true,
      data: record
    })
  } catch (err) {
    console.error('LeaseRequest create error:', err)
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    })
  }
})

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params || {}
    const language = req.currentLanguage;
    const {
      fullName,
      email,
      phoneNumber,
      countryId,
      stateId,
      cityId,
      address,
      subject,
      message
    } = req.body || {}
    // Basic validation
    if (!fullName || !email || !message) {
      return res.status(400).json({
        success: false,
        message: t(language, "response_messages.fullName_email_message_required")
      })
    }

    const payload = {
      full_name: String(fullName).trim(),
      email: String(email).trim(),
      phone_number: phoneNumber ? String(phoneNumber).trim() : null,
      country_id: countryId ? Number(countryId) : null,
      state_id: stateId ? Number(stateId) : null,
      city_id: cityId ? Number(cityId) : null,
      address: address ? String(address).trim() : null,
      subject: subject ? String(subject).trim() : null,
      message: String(message).trim()
    }

    const record = await prisma.lease_requests.update({
      where: { id: Number(id) },
      data: payload
    })

    return res.status(200).json({
      success: true,
      data: record
    })
  } catch (err) {
    console.error('LeaseRequest update error:', err)
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    })
  }
})

router.get('/', async (req, res) => {
  try {
    const records = await prisma.lease_requests.findMany({
      where: { is_deleted: 0 },
      include: {
        countries: true,
        states: true,
        cities: true
      },
      orderBy: { created_at: 'asc' }
    })

    return res.status(200).json({
      success: true,
      data: records
    })
  } catch (err) {
    console.error('LeaseRequest fetch error:', err)
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    })
  }
})

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params || {}
    const language = req.currentLanguage;
    const record = await prisma.lease_requests.findFirst({
      where: { id: Number(id) }
    })
    if (!record || record.is_deleted) {
      return res.status(404).json({
        success: false,
        message: t(language, "response_messages.lease_request_not_found")
      })
    }
    await prisma.lease_requests.update({
      where: { id: Number(id) },
      data: { is_deleted: 1 }
    })
    return res.status(200).json({
      success: true,
      message: t(language, "response_messages.lease_request_deleted_successfully")
    })
  } catch (err) {
    console.error('LeaseRequest delete error:', err)
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    })
  }
})

export default router;