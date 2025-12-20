import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

// Multer storage for contract documents/images
const contractsDir = path.join(PUBLIC_DIR, 'images', 'contract');
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

// List contracts (filterable, pagination, search)
router.get("/", async (req, res) => {
  try {
    const { 
      projectId, 
      investorId, 
      offtakerId, 
      status, 
      includeDeleted, 
      page = 1, 
      limit, 
      userId, 
      id,
      search,
      downloadAll,
      startDate,
      endDate
    } = req.query;

    const parsedLimit = Number(limit);
    const limitNumber = !Number.isNaN(parsedLimit) && parsedLimit > 0 ? parsedLimit : null;
    const fetchAll = downloadAll === "1" || downloadAll === "true" || !limitNumber;

    let where = {
      ...(id ? { id: Number(id) } : {}),
      ...(projectId ? { project_id: Number(projectId) } : {}),
      ...(investorId ? { investor_id: Number(investorId) } : {}),
      ...(offtakerId ? { offtaker_id: Number(offtakerId) } : {}),
      ...(typeof status !== 'undefined' ? { status: Number(status) } : {}),
      ...(includeDeleted === '1' ? {} : { is_deleted: 0 }),
      // ...(userId ? { userId: Number(userId) } : {}),
    };

    // Date range filtering
    let dateFilter = undefined;
    const hasStart = typeof startDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(startDate);
    const hasEnd = typeof endDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(endDate);

    if (hasStart && hasEnd) {
      const gte = new Date(`${startDate}T00:00:00.000Z`);
      const lte = new Date(`${endDate}T23:59:59.999Z`);
      dateFilter = gte > lte ? { gte: lte, lte: gte } : { gte, lte };
    } else if (hasStart && !hasEnd) {
      dateFilter = {
        gte: new Date(`${startDate}T00:00:00.000Z`),
        lte: new Date(`${startDate}T23:59:59.999Z`),
      };
    } else if (!hasStart && hasEnd) {
      dateFilter = { lte: new Date(`${endDate}T23:59:59.999Z`) };
    }

    if (dateFilter) {
      where.contract_date = dateFilter;
    }

    // Search functionality
    const trimmedSearch = typeof search === "string" ? search.trim() : "";
    if (trimmedSearch) {
      const numericSearch = Number(trimmedSearch);
      const isNumeric = !Number.isNaN(numericSearch);

      const isISODate = /^\d{4}-\d{2}-\d{2}$/.test(trimmedSearch);
      const dateRange = isISODate
        ? {
            gte: new Date(`${trimmedSearch}T00:00:00.000Z`),
            lte: new Date(`${trimmedSearch}T23:59:59.999Z`),
          }
        : null;

      const orFilters = [
        { contractTitle: { contains: trimmedSearch, mode: "insensitive" } },
        { projects: { project_name: { contains: trimmedSearch, mode: "insensitive" } } },
        { users: { full_name: { contains: trimmedSearch, mode: "insensitive" } } },
        { interested_investors: { fullName: { contains: trimmedSearch, mode: "insensitive" } } },
      ];

      if (dateRange) {
        orFilters.push({ contract_date: dateRange });
      }

      if (orFilters.length) {
        where.AND = [...(where.AND || []), { OR: orFilters }];
      }
    }

    // Get total count
    let totalCount = await prisma.contracts.count({ where });

    // Fallback for single-day search with no results
    if (totalCount === 0 && hasStart && !hasEnd) {
      const fallbackDate = { gte: new Date(`${startDate}T00:00:00.000Z`) };
      where = { ...where, contractDate: fallbackDate };
      totalCount = await prisma.contract.count({ where });
    }

    const skip = (Number(page) - 1) * (limitNumber || 20);

    const data = await prisma.contracts.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: fetchAll ? 0 : skip,
      take: fetchAll ? undefined : limitNumber,
      include: {
        projects: {
          include: {
            cities: true,
            states: true,
            countries: true,
            project_types: true,
          },
        },
        users: true,
        interested_investors: true,
      },
    });

    // Fetch project list for dropdown
    const projectList = await prisma.projects.findMany({
      where: { is_deleted: 0 },
      orderBy: { project_name: "asc" },
    });

    const offtaker = await prisma.roles.findFirst({
      where: { is_deleted: 0, name: 'offtaker' },
    });

    const offtakerList = await prisma.users.findMany({
      where: { is_deleted: 0, role_id: offtaker?.id ?? 3 },
      orderBy: { full_name: "asc" },
    });

    const investorList = await prisma.interested_investors.findMany({
      where: { is_deleted: 0 },
      orderBy: { full_name: "asc" },
    });

    const effectiveLimit = limitNumber || totalCount;
    const returnedCount = fetchAll ? totalCount : Math.min(totalCount, effectiveLimit);
    const pageSize = 20;

    return res.json({ 
      success: true, 
      data,
      projectList,
      offtakerList,
      investorList,
      pagination: {
        page: Number(page),
        limit: fetchAll ? totalCount : effectiveLimit,
        total: returnedCount,
        pages: Math.max(1, Math.ceil(returnedCount / pageSize)),
      },
    });
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
        const oldPath = existing?.documentUpload
          ? path.join(PUBLIC_DIR, existing.documentUpload.replace(/^\//, ''))
          : null;
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

// update contract status
router.put("/:id/status", authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status, reason } = req.body;
    const existing = await prisma.contract.findUnique({ where: { id } });
    if (!existing || existing.is_deleted) {
      return res.status(404).json({ success: false, message: 'Contract not found' });
    }
    // If rejected, save the reason
    const updateData = { status: Number(status) };
    if (Number(status) === 2 && reason) {
      updateData.rejectreason = reason;
    } else if (Number(status) !== 2) {
      updateData.rejectreason = null;
    }
    const updated = await prisma.contract.update({
      where: { id },
      data: updateData,
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