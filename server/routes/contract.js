import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticateToken } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createNotification } from '../utils/notifications.js';
import { getUserLanguage, t } from '../utils/i18n.js';
import { getUserFullName } from '../utils/common.js';
import { sendEmailUsingTemplate } from '../utils/email.js';
import { PROJECT_STATUS } from '../../src/constants/project_status.js';
import { ROLES } from '../../src/constants/roles.js';
import { uploadToS3, deleteFromS3, isS3Enabled, buildUploadUrl } from '../services/s3Service.js';
import { getAdminUsers } from '../utils/constants.js';

const router = express.Router();


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

// Multer memory storage for contract documents/images (for S3 upload)
const contractMemoryStorage = multer.memoryStorage();
const upload = multer({
  storage: contractMemoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (validTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type.'));
    }
  }
});

// Create contract (supports multipart file 'document' OR a direct document path in body)
router.post("/", authenticateToken, upload.single('document'), async (req, res) => {
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
    const userId = req.user?.id; // Get user ID from authenticated token

    // Handle document upload (image/pdf) with S3
    let uploadedPath = null;
    if (req.file) {
      const s3Enabled = await isS3Enabled();
      if (s3Enabled) {
        try {
          const s3Result = await uploadToS3(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            {
              folder: 'contracts',
              metadata: {
                projectId: String(projectId || ''),
                uploadType: 'contract_document'
              }
            }
          );
          if (s3Result.success) {
            uploadedPath = s3Result.data.fileKey;
          }
        } catch (err) {
          console.error('S3 upload error:', err);
        }
      } else {
        return res.status(500).json({ success: false, message: 'S3 is disabled' });
      }
    } else if (documentUpload) {
      uploadedPath = documentUpload;
    }

    if (!contractTitle) {
      return res.status(400).json({ success: false, message: 'contractTitle is required' });
    }

    const formattedDate = contractDate ? new Date(contractDate) : null;
    if (contractDate && isNaN(formattedDate)) {
      return res.status(400).json({ success: false, message: 'Invalid date format' });
    }

    const created = await prisma.contracts.create({
      data: {
        offtaker_id: offtakerId ? Number(offtakerId) : null,
        investor_id: investorId ? Number(investorId) : null,
        project_id: projectId ? Number(projectId) : null,
        contract_title: contractTitle,
        contract_description: contractDescription || null,
        document_upload: uploadedPath,
        contract_date: formattedDate ? formattedDate : null,
        status: typeof status !== 'undefined' ? Number(status) : 0,
        created_by: userId,
      },
      include: {
        projects: true,
        users: true,
        interested_investors: true,
      },
    });

    if (created) {
      const lang = await getUserLanguage(offtakerId ? offtakerId : investorId);
      const creator_name = await getUserFullName(userId);

      const notification_title = t(lang, 'notification_msg.contract_title');

      const notification_message = t(lang, 'notification_msg.contract_created', {
        project_name: created?.projects.project_name,
        created_by: creator_name
      });

      const notificationPayload = {
        title: notification_title,
        message: notification_message,
        moduleType: 'projects',
        moduleId: projectId,
        created_by: userId
      };

      //  Offtaker notification
      if (offtakerId) {
        await createNotification({
          userId: offtakerId,
          actionUrl: `/offtaker/contracts/details/${created.id}`,
          ...notificationPayload,
        });

        // Send email to offtaker
        const offtakerUser = await prisma.users.findUnique({ where: { id: Number(offtakerId) } });
        if (offtakerUser?.email) {
          const contractUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/offtaker/contracts/details/${created.id}`;
          const templateData = {
            full_name: offtakerUser.full_name || 'User',
            user_email: offtakerUser.email,
            contract_title: created.contract_title,
            project_name: created?.projects?.project_name || 'N/A',
            system_capacity: created?.projects?.project_size || 'N/A',
            lease_start_date: created.contract_date ? new Date(created.contract_date).toLocaleDateString() : 'N/A',
            lease_price: created?.projects?.weshare_price_kwh || 'N/A',
            contract_duration: created?.projects?.lease_term + ' (Years)' || 'N/A',
            site_url: process.env.FRONTEND_URL || 'http://localhost:3000',
            company_name: 'WeShare Energy',
            company_logo: `${process.env.NEXT_PUBLIC_URL || ''}/images/main_logo.png`,
            support_email: 'support@weshare.com',
            support_phone: '+1 (555) 123-4567',
            support_hours: 'Mon–Fri, 9am–6pm GMT',
            current_date: new Date().toLocaleDateString(),
            login_url: contractUrl,
          };

          // Prepare attachments
          const attachments = [];
          if (created.document_upload) {
            const s3Enabled = await isS3Enabled();
            if (s3Enabled) {
              // Use S3 URL for attachment
              const s3Url = buildUploadUrl(created.document_upload);
              attachments.push({
                filename: path.basename(created.document_upload),
                path: s3Url,
              });
            } else {
              // Fallback to local file
              const docPath = path.join(PUBLIC_DIR, created.document_upload.replace(/^\//, ''));
              if (fs.existsSync(docPath)) {
                attachments.push({
                  filename: path.basename(docPath),
                  path: docPath,
                });
              }
            }
          }

          sendEmailUsingTemplate({
            to: offtakerUser.email,
            templateSlug: 'contract_created_for_offtaker',
            templateData,
            language: offtakerUser.language || 'en',
            attachments,
          })
            .then((result) => {
              if (result.success) {
                console.log(`Contract email sent to ${offtakerUser.email}`);
              } else {
                console.warn(`Could not send contract email: ${result.error}`);
              }
            })
            .catch((error) => {
              console.error('Failed to send contract email:', error.message);
            });
        }
      }

      // Interested Investor notification
      if (investorId) {
        await createNotification({
          userId: investorId,
          actionUrl: `/investor/contracts/details/${created.id}`,
          ...notificationPayload,
        });

        // Send email to investor
        const investor = await prisma.interested_investors.findFirst({ where: { user_id: Number(investorId), project_id: Number(projectId), is_deleted: 0 } });
        if (investor?.email) {
          const contractUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/investor/contracts/details/${created.id}`;
          const templateData = {
            full_name: investor.full_name || 'Investor',
            user_email: investor.email,
            contract_title: created.contract_title,
            project_name: created?.projects?.project_name || 'N/A',
            system_capacity: created?.projects?.project_size || 'N/A',
            lease_start_date: created.contract_date ? new Date(created.contract_date).toLocaleDateString() : 'N/A',
            lease_price: created?.projects?.weshare_price_kwh || 'N/A',
            contract_duration: created?.projects?.lease_term + ' (Years)' || 'N/A',
            signed_pdf: created.document_upload ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}${created.document_upload}` : '',
            site_url: process.env.FRONTEND_URL || 'http://localhost:3000',
            company_name: 'WeShare Energy',
            company_logo: `${process.env.NEXT_PUBLIC_URL || ''}/images/main_logo.png`,
            support_email: 'support@weshare.com',
            support_phone: '+1 (555) 123-4567',
            support_hours: 'Mon–Fri, 9am–6pm GMT',
            current_date: new Date().toLocaleDateString(),
            login_url: contractUrl,
          };

          // Prepare attachments
          const investorAttachments = [];
          if (created.document_upload) {
            const s3Enabled = await isS3Enabled();
            if (s3Enabled) {
              // Use S3 URL for attachment
              const s3Url = buildUploadUrl(created.document_upload);
              investorAttachments.push({
                filename: path.basename(created.document_upload),
                path: s3Url,
              });
            } else {
              // Fallback to local file
              const docPath = path.join(PUBLIC_DIR, created.document_upload.replace(/^\//, ''));
              if (fs.existsSync(docPath)) {
                investorAttachments.push({
                  filename: path.basename(docPath),
                  path: docPath,
                });
              }
            }
          }

          sendEmailUsingTemplate({
            to: investor.email,
            templateSlug: 'contract_created_for_investor',
            templateData,
            language: investor.users?.language || 'en',
            attachments: investorAttachments,
          })
            .then((result) => {
              if (result.success) {
                console.log(`✅ Contract email sent to ${investor.email}`);
              } else {
                console.warn(`⚠️ Could not send contract email: ${result.error}`);
              }
            })
            .catch((error) => {
              console.error('❌ Failed to send contract email:', error.message);
            });
        }
      }
    }

    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get contract count for investor
router.post('/count', authenticateToken, async (req, res) => {
  try {
    const { investorId, offtakerId } = req.body;

    let whereCondition = {
      is_deleted: 0
    };

    // If investorId is present
    if (investorId) {
      whereCondition.investor_id = parseInt(investorId);
    }
    // Else check for offtakerId
    else if (offtakerId) {
      whereCondition.offtaker_id = parseInt(offtakerId);
    } 
    else {
      return res.status(400).json({
        success: false,
        message: "InvestorId or OfftakerId is required"
      });
    }

    // Count all contracts for this investor (not deleted)
    const totalCount = await prisma.contracts.count({
      where: whereCondition
    });

    // Count by status
    const acceptedCount = await prisma.contracts.count({
      where: { ...whereCondition, status: 1 }
    });

    const rejectedCount = await prisma.contracts.count({
      where: { ...whereCondition, status: 2 }
    });

    const cancelledCount = await prisma.contracts.count({
      where: { ...whereCondition, status: 3 }
    });

    res.json({
      success: true,
      data: {
        count: totalCount,
        accepted: acceptedCount,
        rejected: rejectedCount,
        cancelled: cancelledCount
      }
    });
  } catch (error) {
    console.error("Get contract count error:", error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
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
        { contract_title: { contains: trimmedSearch, mode: "insensitive" } },
        { projects: { project_name: { contains: trimmedSearch, mode: "insensitive" } } },
        { users: { full_name: { contains: trimmedSearch, mode: "insensitive" } } },
        { interested_investors: { full_name: { contains: trimmedSearch, mode: "insensitive" } } },
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
      where = { ...where, contract_date: fallbackDate };
      totalCount = await prisma.contracts.count({ where });
    }

    const skip = (Number(page) - 1) * (limitNumber || 20);

    // Sort options
    const { sortBy } = req.query;
    let orderBy = { created_at: 'desc' }; // default
    if (sortBy === 'oldest') {
      orderBy = { created_at: 'asc' };
    } else if (sortBy === 'newest') {
      orderBy = { created_at: 'desc' };
    } else if (sortBy === 'az') {
      orderBy = { contract_title: 'asc' };
    } else if (sortBy === 'za') {
      orderBy = { contract_title: 'desc' };
    }

    const data = await prisma.contracts.findMany({
      where,
      orderBy,
      skip: fetchAll ? 0 : skip,
      take: fetchAll ? undefined : limitNumber,
      include: {
        projects: {
          include: {
            cities: true,
            states: true,
            countries: true,
            project_types: true,
            interested_investors: true,
            project_images: true,
            offtaker: { select: { full_name: true, email: true } },
            investor: { select: { full_name: true, email: true } },
          },
        },
        users: true,
      },
    });

    // Fetch project list for dropdown
    const projectList = await prisma.projects.findMany({
      where: { is_deleted: 0, project_status_id: PROJECT_STATUS.RUNNING },
      orderBy: { project_name: "asc" },
    });

    const offtaker = await prisma.roles.findFirst({
      where: { is_deleted: 0, name: 'offtaker' },
    });

    const offtakerList = await prisma.users.findMany({
      where: { is_deleted: 0, role_id: offtaker?.id ?? ROLES.OFFTAKER },
      orderBy: { full_name: "asc" },
    });

    const investorList = await prisma.users.findMany({
      where: { is_deleted: 0, role_id: ROLES.INVESTOR },
      orderBy: { full_name: "asc" },
    });

    const effectiveLimit = limitNumber || 20;

    return res.json({
      success: true,
      data,
      projectList,
      offtakerList,
      investorList,
      pagination: {
        page: Number(page),
        limit: effectiveLimit,
        total: totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / effectiveLimit)),
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
    const contract = await prisma.contracts.findFirst({
      where: { id, is_deleted: 0 },
      include: {
        projects: true,
        users: true,
        interested_investors: true,
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
      investorId,
      contractTitle,
      contractDescription,
      documentUpload,
      contractDate,
      status,
    } = req.body;
    const userId = req.user?.id; // Get user ID from authenticated token

    const existing = await prisma.contracts.findFirst({ where: { id } });
    if (!existing || existing.is_deleted) {
      return res.status(404).json({ success: false, message: 'Contract not found' });
    }

    // Handle document upload (image/pdf) with S3
    let newDocumentPath = null;
    if (req.file) {
      const s3Enabled = await isS3Enabled();
      if (s3Enabled) {
        try {
          // Delete old file from S3 if exists
          if (existing.document_upload) {
            try {
              let fileKey = existing.document_upload;
              if (fileKey.startsWith('http')) {
                const url = new URL(fileKey);
                fileKey = url.pathname.substring(1);
              }
              await deleteFromS3(fileKey);
              console.log('Old S3 file deleted:', fileKey);
            } catch (s3Err) {
              console.error('S3 delete failed:', s3Err.message);
            }
          }

          // Upload new file to S3
          const s3Result = await uploadToS3(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            {
              folder: 'contracts',
              metadata: {
                projectId: String(projectId || ''),
                uploadType: 'contract_document'
              }
            }
          );
          if (s3Result.success) {
            newDocumentPath = s3Result.data.fileKey;
          }
        } catch (err) {
          console.error('S3 upload error:', err);
        }
      } else {
        // Local fallback
        return res.status(500).json({ success: false, message: 'S3 is disabled' });
      }
    }

    const formattedDate = contractDate ? new Date(contractDate) : null;
    if (contractDate && isNaN(formattedDate)) {
      return res.status(400).json({ success: false, message: 'Invalid date format' });
    }

    const dataUpdate = {
      offtaker_id: offtakerId ? Number(offtakerId) : null,
      investor_id: investorId ? Number(investorId) : null,
      project_id: projectId ? Number(projectId) : null,
      contract_title: contractTitle,
      contract_description: contractDescription || null,
      document_upload: newDocumentPath ? newDocumentPath : (documentUpload || null),
      contract_date: formattedDate ? formattedDate : null,
      status: typeof status !== 'undefined' ? Number(status) : 0,
      created_by: userId,
      updated_at: new Date(),
    };

    const updated = await prisma.contracts.update({
      where: { id },
      data: dataUpdate,
      include: {
        projects: true,
        users: true,
        interested_investors: true,
      },
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// update contract status
router.put("/:id/status", authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status, reason } = req.body;

    const existing = await prisma.contracts.findFirst({ where: { id }, include: { projects: true, users: true, interested_investors: true } });
    if (!existing || existing.is_deleted) {
      return res.status(404).json({ success: false, message: 'Contract not found' });
    }
    // If rejected or cancelled, save the reason
    const updateData = { status: Number(status) };
    if ((Number(status) === 2 || Number(status) === 3) && reason) {
      updateData.rejectreason = reason;
    } else if (Number(status) !== 2 && Number(status) !== 3) {
      updateData.rejectreason = null;
    }

    // If approved with file, save signed document
    if (Number(status) === 1 && req.file) {
      const s3Enabled = await isS3Enabled();
      if (s3Enabled) {
        try {
          // Delete old signed document from S3 if exists
          if (existing.signed_document_upload) {
            try {
              let fileKey = existing.signed_document_upload;
              if (fileKey.startsWith('http')) {
                const url = new URL(fileKey);
                fileKey = url.pathname.substring(1);
              }
              await deleteFromS3(fileKey);
            } catch (s3Err) {
              console.error('S3 delete failed:', s3Err.message);
            }
          }

          const s3Result = await uploadToS3(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            {
              folder: 'contracts/signed',
              metadata: {
                contractId: String(id),
                uploadType: 'signed_contract_document'
              }
            }
          );
          if (s3Result.success) {
            updateData.signed_document_upload = s3Result.data.fileKey;
          }
          console.log('S3 signed document uploaded:', s3Result.data.fileKey);
        } catch (err) {
          console.error('S3 upload error:', err);
        }
      } else {
        return res.status(500).json({ success: false, message: 'S3 is disabled' });
      }
    }

    const updated = await prisma.contracts.update({
      where: { id },
      data: updateData,
    });

    const lang = await getUserLanguage(existing?.created_by);
    const creator_name = await getUserFullName(existing?.offtaker_id);

    let notification_title = '';
    let notification_message = '';

    if (Number(status) === 1) {
      // Send email to offtaker if exists
      if (existing.offtaker_id) {
        const offtakerUser = await prisma.users.findUnique({ where: { id: Number(existing.offtaker_id) } });
        if (offtakerUser?.email) {
          const templateData = {
            full_name: offtakerUser.full_name || 'User',
            user_email: offtakerUser.email,
            project_name: existing?.projects?.project_name || 'N/A',
            solis_id: existing?.projects?.solis_plant_id || 'N/A',
            system_capacity: existing?.projects?.project_size || 'N/A',
            lease_start_date: existing?.contract_date ? new Date(existing.contract_date).toLocaleDateString('en-GB') : 'N/A',
            lease_price: existing?.projects?.weshare_price_kwh || 'N/A',
            contract_duration: existing?.projects?.lease_term ? `${existing.projects.lease_term} Years` : 'N/A',
            site_url: process.env.FRONTEND_URL || 'http://localhost:3000',
            company_name: 'WeShare Energy',
            company_logo: `${process.env.NEXT_PUBLIC_URL || ''}/images/main_logo.png`,
            support_email: 'support@weshare.com',
            support_phone: '+1 (555) 123-4567',
            support_hours: 'Mon–Fri, 9am–6pm GMT',
            current_date: new Date().toLocaleDateString(),
          };

          // Prepare attachments (use S3 URL stored in updateData.signed_document_upload)
          const offtakerAttachments = [];
          if (req.file && updateData.signed_document_upload) {
            const s3Url = buildUploadUrl(updateData.signed_document_upload);
            offtakerAttachments.push({
              filename: path.basename(updateData.signed_document_upload),
              path: s3Url,
            });
          }

          sendEmailUsingTemplate({
            to: offtakerUser.email,
            templateSlug: 'contract_approved_for_offtaker',
            templateData,
            language: offtakerUser.language || 'en',
            attachments: offtakerAttachments,
          })
            .then((result) => {
              if (result.success) {
                console.log(`Contract approval email sent to offtaker: ${offtakerUser.email}`);
              } else {
                console.warn(` Could not send contract approval email: ${result.error}`);
              }
            })
            .catch((error) => {
              console.error(' Failed to send contract approval email:', error.message);
            });
        }

        const adminUsers = await getAdminUsers(prisma, { activeOnly: true });
        notification_title = t(lang, 'notification_msg.contract_approved_title');
        notification_message = t(lang, 'notification_msg.contract_approved_message', {
          contract_title: existing.contract_title,
          created_by: creator_name
        });
        for (const admin of adminUsers) {
          await createNotification({
            userId: admin.id.toString(),
            title: notification_title,
            message: notification_message,
            moduleType: 'contract',
            moduleId: existing?.id,
            actionUrl: `/admin/contract/view/${existing?.id}`,
            created_by: existing?.offtaker_id
          });
        }
      }

      // Send email to investor if exists
      if (existing.investor_id) {
        const investor = await prisma.interested_investors.findFirst({
          where: { user_id: Number(existing.investor_id), project_id: Number(existing.project_id), is_deleted: 0 }
        });

        if (investor?.email) {
          const templateData = {
            full_name: investor.full_name || 'Investor',
            user_email: investor.email,
            project_name: existing?.projects?.project_name || 'N/A',
            solis_id: existing?.projects?.solis_plant_id || 'N/A',
            system_capacity: existing?.projects?.project_size || 'N/A',
            lease_start_date: existing?.contract_date ? new Date(existing.contract_date).toLocaleDateString('en-GB') : 'N/A',
            lease_price: existing?.projects?.weshare_price_kwh || 'N/A',
            contract_duration: existing?.projects?.lease_term ? `${existing.projects.lease_term} Years` : 'N/A',
            site_url: process.env.FRONTEND_URL || 'http://localhost:3000',
            company_name: 'WeShare Energy',
            company_logo: `${process.env.NEXT_PUBLIC_URL || ''}/images/main_logo.png`,
            support_email: 'support@weshare.com',
            support_phone: '+1 (555) 123-4567',
            support_hours: 'Mon–Fri, 9am–6pm GMT',
            current_date: new Date().toLocaleDateString(),
          };

          // Prepare attachments (use S3 URL stored in updateData.signed_document_upload)
          const investorAttachments = [];
          if (req.file && updateData.signed_document_upload) {
            const s3Url = buildUploadUrl(updateData.signed_document_upload);
            investorAttachments.push({
              filename: path.basename(updateData.signed_document_upload),
              path: s3Url,
            });
          }

          sendEmailUsingTemplate({
            to: investor.email,
            templateSlug: 'contract_approved_for_investor',
            templateData,
            language: investor.language || 'en',
            attachments: investorAttachments,
          })
            .then((result) => {
              if (result.success) {
                console.log(`Contract approval email sent to investor: ${investor.email}`);
              } else {
                console.warn(`Could not send contract approval email: ${result.error}`);
              }
            })
            .catch((error) => {
              console.error('Failed to send contract approval email:', error.message);
            });
        }
        const adminUsers = await getAdminUsers(prisma, { activeOnly: true });

        notification_title = t(lang, 'notification_msg.contract_approved_title');
        notification_message = t(lang, 'notification_msg.contract_approved_message', {
          contract_title: existing.contract_title,
          created_by: investor.full_name
        });
        for (const admin of adminUsers) {
          await createNotification({
            userId: admin.id.toString(),
            title: notification_title,
            message: notification_message,
            moduleType: 'contract',
            moduleId: existing?.id,
            actionUrl: `/admin/contract/view/${existing?.id}`,
            created_by: existing?.investor_id
          });
        }
      }
    }

    if (Number(status) === 2) {
      notification_title = t(lang, 'notification_msg.contract_rejected_title');
      notification_message = t(lang, 'notification_msg.contract_rejected_message', {
        contract_title: existing.contract_title,
        created_by: creator_name
      });

      // Send email to offtaker if exists
      if (existing.offtaker_id) {
        const offtakerUser = await prisma.users.findFirst({ where: { id: Number(existing.offtaker_id) } });
        if (offtakerUser?.email) {
          const templateData = {
            full_name: offtakerUser.full_name || 'User',
            user_email: offtakerUser.email,
            contract_title: existing.contract_title || 'N/A',
            project_name: existing?.projects?.project_name || 'N/A',
            solis_id: existing?.projects?.solis_plant_id || 'N/A',
            rejection_reason: existing.rejectreason || 'No reason provided',
            site_url: process.env.FRONTEND_URL || 'http://localhost:3000',
            company_name: 'WeShare Energy',
            company_logo: `${process.env.NEXT_PUBLIC_URL || ''}/images/main_logo.png`,
            support_email: 'support@weshare.com',
            support_phone: '+1 (555) 123-4567',
            support_hours: 'Mon–Fri, 9am–6pm GMT',
            current_date: new Date().toLocaleDateString(),
          };

          sendEmailUsingTemplate({
            to: offtakerUser.email,
            templateSlug: 'contract_rejected_for_offtaker',
            templateData,
            language: offtakerUser.language || 'en',
          })
            .then((result) => {
              if (result.success) {
                console.log(`Contract rejection email sent to offtaker: ${offtakerUser.email}`);
              } else {
                console.warn(` Could not send contract rejection email: ${result.error}`);
              }
            })
            .catch((error) => {
              console.error('Failed to send contract rejection email:', error.message);
            });
        }
        const adminUsers = await getAdminUsers(prisma, { activeOnly: true });

        for (const admin of adminUsers) {
          await createNotification({
            userId: admin.id.toString(),
            title: notification_title,
            message: notification_message,
            moduleType: 'contract',
            moduleId: existing?.id,
            actionUrl: `/admin/contract/view/${existing?.id}`,
            created_by: existing?.offtaker_id
          });
        }
      }

      // Send email to investor if exists
      if (existing.investor_id) {
        const investor = await prisma.interested_investors.findFirst({
          where: { user_id: Number(existing.investor_id), project_id: Number(existing.project_id), is_deleted: 0 }
        });
        if (investor?.email) {
          const templateData = {
            full_name: investor.full_name || 'Investor',
            user_email: investor.email,
            contract_title: existing.contract_title || 'N/A',
            project_name: existing?.projects?.project_name || 'N/A',
            solis_id: existing?.projects?.solis_plant_id || 'N/A',
            rejection_reason: existing.rejectreason || 'No reason provided',
            site_url: process.env.FRONTEND_URL || 'http://localhost:3000',
            company_name: 'WeShare Energy',
            company_logo: `${process.env.NEXT_PUBLIC_URL || ''}/images/main_logo.png`,
            support_email: 'support@weshare.com',
            support_phone: '+1 (555) 123-4567',
            support_hours: 'Mon–Fri, 9am–6pm GMT',
            current_date: new Date().toLocaleDateString(),
          };

          sendEmailUsingTemplate({
            to: investor.email,
            templateSlug: 'contract_rejected_for_investor',
            templateData,
            language: investor.language || 'en',
          })
            .then((result) => {
              if (result.success) {
                console.log(`Contract rejection email sent to investor: ${investor.email}`);
              } else {
                console.warn(`Could not send contract rejection email: ${result.error}`);
              }
            })
            .catch((error) => {
              console.error('Failed to send contract rejection email:', error.message);
            });
        }
        const adminUsers = await getAdminUsers(prisma, { activeOnly: true });
        notification_title = t(lang, 'notification_msg.contract_rejected_title');
        notification_message = t(lang, 'notification_msg.contract_rejected_message', {
          contract_title: existing.contract_title,
          created_by: investor.full_name
        });
        for (const admin of adminUsers) {
          await createNotification({
            userId: admin.id.toString(),
            title: notification_title,
            message: notification_message,
            moduleType: 'contract',
            moduleId: existing?.id,
            actionUrl: `/admin/contract/view/${existing?.id}`,
            created_by: existing?.investor_id
          });
        }
      }
    }

    if (Number(status) === 3) {
      notification_title = t(lang, 'notification_msg.contract_cancelled_title');
      notification_message = t(lang, 'notification_msg.contract_cancelled_message', {
        contract_title: existing.contract_title,
        created_by: creator_name
      });

      // Send email to offtaker if exists
      if (existing?.offtaker_id) {
        const offtakerUser = await prisma.users.findUnique({ where: { id: Number(existing.offtaker_id) } });
        if (offtakerUser?.email) {
          const templateData = {
            full_name: offtakerUser.full_name || 'User',
            user_email: offtakerUser.email,
            contract_title: existing.contract_title || 'N/A',
            project_name: existing?.projects?.project_name || 'N/A',
            solis_id: existing?.projects?.solis_plant_id || 'N/A',
            rejection_reason: existing.rejectreason || 'No reason provided',
            site_url: process.env.FRONTEND_URL || 'http://localhost:3000',
            company_name: 'WeShare Energy',
            company_logo: `${process.env.NEXT_PUBLIC_URL || ''}/images/main_logo.png`,
            support_email: 'support@weshare.com',
            support_phone: '+1 (555) 123-4567',
            support_hours: 'Mon–Fri, 9am–6pm GMT',
            current_date: new Date().toLocaleDateString(),
          };

          sendEmailUsingTemplate({
            to: offtakerUser.email,
            templateSlug: 'contract_cancelled_for_offtaker',
            templateData,
            language: offtakerUser.language || 'en',
          })
            .then((result) => {
              if (result.success) {
                console.log(`Contract cancellation email sent to offtaker: ${offtakerUser.email}`);
              } else {
                console.warn(`Could not send contract cancellation email: ${result.error}`);
              }
            })
            .catch((error) => {
              console.error('Failed to send contract cancellation email:', error.message);
            });
        }

        await createNotification({
          userId: existing?.offtaker_id,
          title: notification_title,
          message: notification_message,
          moduleType: 'contract',
          moduleId: existing?.id,
          actionUrl: `/offtaker/contract/view/${existing?.id}`,
          created_by: 1
        });
      }

      // Send email to investor if exists
      if (existing?.investor_id) {
        const investor = await prisma.interested_investors.findFirst({
          where: { user_id: Number(existing.investor_id), project_id: Number(existing.project_id), is_deleted: 0 }
        });
        if (investor?.email) {
          const templateData = {
            full_name: investor.full_name || 'Investor',
            user_email: investor.email,
            contract_title: existing.contract_title || 'N/A',
            project_name: existing?.projects?.project_name || 'N/A',
            solis_id: existing?.projects?.solis_plant_id || 'N/A',
            rejection_reason: existing.rejectreason || 'No reason provided',
            site_url: process.env.FRONTEND_URL || 'http://localhost:3000',
            company_name: 'WeShare Energy',
            company_logo: `${process.env.NEXT_PUBLIC_URL || ''}/images/main_logo.png`,
            support_email: 'support@weshare.com',
            support_phone: '+1 (555) 123-4567',
            support_hours: 'Mon–Fri, 9am–6pm GMT',
            current_date: new Date().toLocaleDateString(),
          };

          sendEmailUsingTemplate({
            to: investor.email,
            templateSlug: '	contract_cancelled_for_investor',
            templateData,
            language: investor.language || 'en',
          })
            .then((result) => {
              if (result.success) {
                console.log(`Contract cancellation email sent to investor: ${investor.email}`);
              } else {
                console.warn(`Could not send contract cancellation email: ${result.error}`);
              }
            })
            .catch((error) => {
              console.error('Failed to send contract cancellation email:', error.message);
            });
        }

        await createNotification({
          userId: existing?.investor_id,
          title: notification_title,
          message: notification_message,
          moduleType: 'contract',
          moduleId: existing?.id,
          actionUrl: `/investor/contract/view/${existing?.id}`,
          created_by: 1
        });
      }
    }

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
    const existing = await prisma.contracts.findFirst({ where: { id } });
    if (!existing || existing.is_deleted) {
      return res.status(404).json({ success: false, message: 'Contract not found' });
    }

    // Delete the uploaded document file if it exists
    if (existing.document_upload) {
      try {
        let fileKey = existing.document_upload;
        if (fileKey.startsWith('http')) {
          const url = new URL(fileKey);
          fileKey = url.pathname.substring(1);
        }
        await deleteFromS3(fileKey);
        console.log('S3 document file deleted:', fileKey);
      } catch (fileError) {
        console.error('Failed to delete document from S3:', fileError);
      }
    }

    // Delete the signed document file if it exists
    if (existing.signed_document_upload) {
      try {
        let fileKey = existing.signed_document_upload;
        if (fileKey.startsWith('http')) {
          const url = new URL(fileKey);
          fileKey = url.pathname.substring(1);
        }
        await deleteFromS3(fileKey);
        console.log('S3 signed document file deleted:', fileKey);
      } catch (fileError) {
        console.error('Failed to delete signed document from S3:', fileError);
      }
    }

    await prisma.contracts.update({
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