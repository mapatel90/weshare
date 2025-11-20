import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

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
      message
    } = req.body || {}

    // Basic validation
    if (!fullName || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'fullName, email and message are required'
      })
    }

    const payload = {
      fullName: String(fullName).trim(),
      email: String(email).trim(),
      phoneNumber: phoneNumber ? String(phoneNumber).trim() : null,
      countryId: countryId ? Number(countryId) : null,
      stateId: stateId ? Number(stateId) : null,
      cityId: cityId ? Number(cityId) : null,
      address: address ? String(address).trim() : null,
      subject: subject ? String(subject).trim() : null,
      message: String(message).trim()
    }

    const record = await prisma.leaseRequest.create({
      data: payload
    })

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
        message: 'fullName, email and message are required'
      })
    }

    const payload = {
      fullName: String(fullName).trim(),
      email: String(email).trim(),  
      phoneNumber: phoneNumber ? String(phoneNumber).trim() : null,
      countryId: countryId ? Number(countryId) : null,
      stateId: stateId ? Number(stateId) : null,
      cityId: cityId ? Number(cityId) : null,
      address: address ? String(address).trim() : null,
      subject: subject ? String(subject).trim() : null,
      message: String(message).trim()
    }

    const record = await prisma.leaseRequest.update({
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
    const records = await prisma.leaseRequest.findMany({
      where: { is_deleted: 0 },
      include: {
        country: true,
        state: true,
        city: true
      },
      orderBy: { createdAt: 'asc' }
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

    const record = await prisma.leaseRequest.findUnique({
      where: { id: Number(id) }
    })  
    if (!record || record.is_deleted) {
      return res.status(404).json({
        success: false,
        message: 'Lease request not found'
      })
    }
    await prisma.leaseRequest.update({
      where: { id: Number(id) },
      data: { is_deleted: 1 }
    })
    return res.status(200).json({
      success: true,
      message: 'Lease request deleted successfully'
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