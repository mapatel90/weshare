import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Multer storage for contract documents/images
const contractsDir = path.join(process.cwd(), 'public', 'images', 'contract');
const contractStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(contractsDir, { recursive: true });
    cb(null, contractsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const base = path.basename(file.originalname, ext).replace(/[^a-z0-9-_]/gi, '_');
    const ts = Date.now();
    cb(null, `${base}_${ts}${ext}`);
  },
});
const upload = multer({ storage: contractStorage });

// Create contract (supports multipart file 'document' OR a direct document path in body)
router.post("/", upload.single('document'), async (req, res) => {
  try {
    const {
      projectId,
      offtakerId,
      investorId,        // now expecting InterestedInvestor.id
      contractTitle,
      contractDescription,
      documentUpload,
      contractDate,
      status,
    } = req.body;

    // prefer uploaded file path
    const uploadedPath = req.file ? `/images/contract/${req.file.filename}` : (documentUpload || null);

    if (!contractTitle) {
      return res.status(400).json({ success: false, message: 'contractTitle is required' });
    }

    const formattedDate = contractDate ? new Date(contractDate) : null;
    if (contractDate && isNaN(formattedDate)) {
      return res.status(400).json({ success: false, message: 'Invalid date format' });
    }

    const created = await prisma.contract.create({
      data: {
        project: projectId ? { connect: { id: Number(projectId) } } : undefined,
        offtaker: offtakerId ? { connect: { id: Number(offtakerId) } } : undefined,
        investor: investorId ? { connect: { id: Number(investorId) } } : undefined, // connects to InterestedInvestor
        contractTitle,
        contractDescription: contractDescription || null,
        documentUpload: uploadedPath || null,
        contractDate: formattedDate,
        status: typeof status !== 'undefined' ? Number(status) : 0,
      },
      include: {
        project: true,
        offtaker: true,
        investor: true,
      },
    });

    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// List contracts (filterable, pagination)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { projectId, investorId, offtakerId, status, includeDeleted, page = 1, limit = 20 } = req.query;
    const where = {
      ...(projectId ? { projectId: Number(projectId) } : {}),
      ...(investorId ? { investorId: Number(investorId) } : {}),
      ...(offtakerId ? { offtaker_id: Number(offtakerId) } : {}),
      ...(typeof status !== 'undefined' ? { status: Number(status) } : {}),
      ...(includeDeleted === '1' ? {} : { is_deleted: 0 }),
    };

    const skip = (Number(page) - 1) * Number(limit);

    const data = await prisma.contract.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      skip,
      take: Number(limit),
      include: {
        project: true,
        offtaker: true,
        investor: true,
      },
    });

    return res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get single contract
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const contract = await prisma.contract.findFirst({
      where: { id, is_deleted: 0 },
      include: {
        project: true,
        offtaker: true,
        investor: true,
      },
    });
    if (!contract) return res.status(404).json({ success: false, message: 'Contract not found' });
    return res.json({ success: true, data: contract });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Update contract (supports multipart file 'document' to replace existing)
router.put("/:id", authenticateToken, upload.single('document'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const {
      projectId,
      offtakerId,
      investorId,        // InterestedInvestor.id
      contractTitle,
      contractDescription,
      documentUpload,
      contractDate,
      status,
    } = req.body;

    const existing = await prisma.contract.findUnique({ where: { id } });
    if (!existing || existing.is_deleted) {
      return res.status(404).json({ success: false, message: 'Contract not found' });
    }

    // If a new file was uploaded, set new path and remove old file (best-effort)
    let newDocumentPath = null;
    if (req.file) {
      newDocumentPath = `/images/contract/${req.file.filename}`;
      try {
        const oldPath = existing?.documentUpload ? path.join(process.cwd(), 'public', existing.documentUpload.replace(/^\//, '')) : null;
        if (oldPath && fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      } catch (e) {
        // ignore errors removing old file
      }
    }

    const formattedDate = contractDate ? new Date(contractDate) : null;
    if (contractDate && isNaN(formattedDate)) {
      return res.status(400).json({ success: false, message: 'Invalid date format' });
    }

    const dataUpdate = {
      project: typeof projectId !== 'undefined' ? (projectId ? { connect: { id: Number(projectId) } } : { disconnect: true }) : undefined,
      offtaker: typeof offtakerId !== 'undefined' ? (offtakerId ? { connect: { id: Number(offtakerId) } } : { disconnect: true }) : undefined,
      investor: typeof investorId !== 'undefined' ? (investorId ? { connect: { id: Number(investorId) } } : { disconnect: true }) : undefined,
      contractTitle: typeof contractTitle !== 'undefined' ? contractTitle : undefined,
      contractDescription: typeof contractDescription !== 'undefined' ? contractDescription : undefined,
      documentUpload: newDocumentPath ? newDocumentPath : (typeof documentUpload !== 'undefined' ? documentUpload : undefined),
      contractDate: typeof contractDate !== 'undefined' ? (formattedDate ? formattedDate : null) : undefined,
      status: typeof status !== 'undefined' ? Number(status) : undefined,
    };

    const updated = await prisma.contract.update({
      where: { id },
      data: dataUpdate,
      include: {
        project: true,
        offtaker: true,
        investor: true,
      },
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Soft delete
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.contract.findUnique({ where: { id } });
    if (!existing || existing.is_deleted) {
      return res.status(404).json({ success: false, message: 'Contract not found' });
    }

    await prisma.contract.update({
      where: { id },
      data: { is_deleted: 1 },
    });

    return res.json({ success: true, message: 'Contract deleted' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;