import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import prisma from "../utils/prisma.js";
import { authenticateToken } from "../middleware/auth.js";
import dayjs from "dayjs";
import { createNotification } from "../utils/notifications.js";
import { getUserLanguage, t } from '../utils/i18n.js';
import { getUserFullName } from "../utils/common.js";
import { sendEmailUsingTemplate } from "../utils/email.js";
import { uploadToS3, deleteFromS3, isS3Enabled } from '../services/s3Service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Always resolve paths relative to the project root instead of process.cwd(),
// so uploads keep working even if the PM2 working directory changes.
const ROOT_DIR = path.resolve(__dirname, "..", "..");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
const PROJECT_IMAGE_LIMIT = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

// Use uploads directory at project root (C:\sunshare\uploads\projects)
const PROJECT_IMAGES_DIR = path.join(ROOT_DIR, "uploads", "projects");

fs.mkdirSync(PROJECT_IMAGES_DIR, { recursive: true });

// Use memory storage for S3 upload compatibility
const projectImageMemoryStorage = multer.memoryStorage();

const projectImageUpload = multer({
  storage: projectImageMemoryStorage,
  limits: { fileSize: MAX_IMAGE_SIZE, files: PROJECT_IMAGE_LIMIT },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

const buildPublicImagePath = (filename) => `/uploads/projects/${filename}`;

const getAbsoluteImagePath = (relativePath) => {
  if (!relativePath) return "";
  const rp = relativePath.replace(/^\//, "");

  // If path is under /uploads resolve from project root (C:\sunshare\uploads/...)
  if (rp.startsWith("uploads/")) {
    return path.resolve(ROOT_DIR, rp);
  }

  // fallback: paths under /public/...
  const normalized = rp.startsWith("public/") ? rp.replace(/^public\//, "") : rp;
  return path.resolve(PUBLIC_DIR, normalized);
};

const removePhysicalFile = (absolutePath) => {
  if (!absolutePath) return;
  fs.unlink(absolutePath, (err) => {
    if (err && err.code !== "ENOENT") {
      console.warn("Failed to delete image:", absolutePath, err.message);
    }
  });
};

const slugify = (text = "") =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

const ensureUniqueSlug = async (desiredSlug, excludeId = null) => {
  const base =
    desiredSlug && desiredSlug.trim()
      ? desiredSlug.trim()
      : `project-${Date.now()}`;
  let candidate = base;
  let suffix = 1;
  let isUnique = false;

  while (!isUnique) {
    const existing = await prisma.projects.findFirst({
      where: {
        project_slug: candidate,
        ...(excludeId && { id: { not: excludeId } }),
      },
      select: { id: true },
    });

    if (existing) {
      candidate = `${base}-${suffix++}`;
    } else {
      isUnique = true;
    }
  }

  return candidate;
};

const router = express.Router();

/**
 * @route   POST /api/projects/check-name
 * @desc    Check if project name already exists
 * @access  Public
 */
router.post("/check-name", async (req, res) => {
  try {
    const { project_name, project_id } = req.body;

    if (!project_name) {
      return res.json({ success: true, exists: false });
    }

    const whereClause = {
      project_name: {
        equals: project_name,
        mode: "insensitive",
      },
      is_deleted: 0,
    };

    if (project_id) {
      whereClause.id = {
        not: parseInt(project_id),
      };
    }

    const existingProject = await prisma.projects.findFirst({
      where: whereClause,
      select: {
        id: true,
        project_name: true,
      },
    });

    res.json({
      success: true,
      exists: !!existingProject,
      project: existingProject,
    });
  } catch (error) {
    console.error("Error checking project name:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check project name",
      error: error.message,
    });
  }
});



router.post("/check-plant-id", async (req, res) => {
  try {
    const { solis_plant_id, project_id } = req.body;
    console.log("req.body", req.body);

    if (!solis_plant_id) {
      return res.json({ success: true, message: "Solisplant ID is required", exists: false });
    }

    // Build the query
    const whereClause = {
      solis_plant_id: solis_plant_id,
      is_deleted: 0,
    };

    if (project_id) {
      whereClause.id = {
        not: parseInt(project_id),
      };
    }

    const existingProject = await prisma.projects.findFirst({
      where: whereClause,
      select: {
        id: true,
        project_name: true,
        solis_plant_id: true,
      },
    });

    res.json({
      success: true,
      exists: !!existingProject,
      project: existingProject,
    });
  } catch (error) {
    console.error("Error checking project name in plant:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check project name in plant",
      error: error.message,
    });
  }
});


/**
 * @route   POST /api/projects
 * @desc    Create a new project
 * @access  Private
 */
router.post("/AddProject", authenticateToken, async (req, res) => {
  try {
    const {
      name,
      project_slug,
      project_type_id,
      offtaker_id,
      address_1,
      address_2,
      country_id,
      state_id,
      city_id,
      zipcode,
      asking_price,
      lease_term,
      product_code,
      project_description,
      investor_profit = "0",
      weshare_profit = "0",
      project_size,
      project_close_date,
      project_location,
      start_date,
      evn_price_kwh,
      weshare_price_kwh,
      created_by,
      project_status_id = 1,
    } = req.body;
    console.log("req.body", req.body);

    if (!name || !project_type_id) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    const baseSlug = slugify(project_slug || name);
    const uniqueSlug = await ensureUniqueSlug(baseSlug);

    const project = await prisma.projects.create({
      data: {
        project_name: name,
        created_by: parseInt(created_by),
        project_slug: uniqueSlug,
        ...(project_type_id && {
          project_types: { connect: { id: project_type_id } },
        }),
        ...(offtaker_id && {
          offtaker: { connect: { id: parseInt(offtaker_id) } },
        }),
        address_1: address_1 || "",
        address_2: address_2 || "",
        ...(country_id && {
          countries: { connect: { id: parseInt(country_id) } },
        }),
        ...(state_id && { states: { connect: { id: parseInt(state_id) } } }),
        ...(city_id && { cities: { connect: { id: parseInt(city_id) } } }),
        zipcode: zipcode || "",
        asking_price: asking_price || "",
        lease_term:
          lease_term !== undefined &&
            lease_term !== null &&
            `${lease_term}` !== ""
            ? parseInt(lease_term)
            : null,
        product_code: product_code || "",
        project_description: project_description || "",
        investor_profit,
        weshare_profit,
        project_size: project_size || "",
        project_close_date: project_close_date
          ? new Date(project_close_date)
          : null,
        project_start_date: start_date ? new Date(start_date) : null,
        project_location: project_location || "",
        weshare_price_kwh: parseFloat(weshare_price_kwh) || null,
        evn_price_kwh: parseFloat(evn_price_kwh) || null,
        ...(project_status_id && {
          project_status: { connect: { id: parseInt(project_status_id) } },
        }),
        updated_at: new Date()
      },
      include: {
        countries: true,
        states: true,
        cities: true,
        project_status: true,
        offtaker: {
          select: { id: true, full_name: true, email: true },
        },
        interested_investors: {
          select: { id: true, full_name: true, email: true, phone_number: true },
        },
      },
    });

    if (project && created_by != 1) {

      const lang = await getUserLanguage(1);

      const notification_title = t(lang, 'notification_msg.project_created_title', {
        project_name: project.project_name
      });

      const notification_message = t(lang, 'notification_msg.project_created', {
        project_name: project.project_name,
        created_by: project.offtaker?.full_name
      });

      await createNotification({
        userId: '1',
        title: notification_title,
        message: notification_message,
        moduleType: 'projects',
        moduleId: project?.id,
        actionUrl: `projects/view/${project.id}`,
        created_by: parseInt(created_by),
      });
    } else {
      const lang = await getUserLanguage(project.offtaker?.id);
      const creator_name = await getUserFullName(created_by);

      const notification_message = t(lang, 'notification_msg.project_created', {
        project_name: project.project_name,
        created_by: creator_name
      });

      await createNotification({
        userId: project.offtaker?.id,
        title: notification_message,
        message: notification_message,
        moduleType: 'projects',
        moduleId: project?.id,
        actionUrl: `projects/view/${project.id}`,
        created_by: parseInt(created_by),
      });
    }

    // Send email notification for new project creation
    if (project && project.offtaker?.email) {
      const templateData = {
        user_name: project.offtaker.full_name || 'User',
        user_email: project.offtaker.email || '',
        user_phone: project.offtaker.phone_number || '',
        project_name: project.project_name || '',
        project_code: project.product_code || '',
        project_description: project.project_description || '',
        company_name: 'WeShare Energy',
        address_1: project.address_1 || '',
        zipcode: project.zipcode || '',
        current_date: new Date().toLocaleDateString(),
        site_url: process.env.SITE_URL || 'https://weshare.com',
      };

      sendEmailUsingTemplate({
        to: project.offtaker.email,
        templateSlug: 'project-mail',
        templateData,
        language: 'vi'
      }).then(() => {
        console.log('Project creation email sent successfully to:', project.offtaker.email);
      }).catch((err) => {
        console.error('Failed to send project creation email:', err);
      });
    }

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: project,
    });
  } catch (error) {
    if (
      error.code === "P2002" &&
      error.meta?.target?.includes("project_slug")
    ) {
      return res.status(409).json({
        success: false,
        message: "Project slug already exists. Please choose a different name.",
      });
    }

    console.error("Error creating project:", error);
    res.status(500).json({ success: false, message: "Error creating project" });
  }
});

/**
 * @route   POST /api/projects/:id/images
 * @desc    Upload project gallery images
 * @access  Private
 */
const projectImageUploadMiddleware = (req, res, next) => {
  projectImageUpload.array("images")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Failed to upload images",
      });
    }
    next();
  });
};

router.post(
  "/:id/images",
  authenticateToken,
  projectImageUploadMiddleware,
  async (req, res) => {
    try {
      const projectId = parseInt(req.params.id, 10);
      if (Number.isNaN(projectId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid project id" });
      }

      const files = req.files || [];
      if (!files.length) {
        return res.status(400).json({
          success: false,
          message: "Please attach at least one image",
        });
      }

      const project = await prisma.projects.findUnique({
        where: { id: projectId },
        select: { project_name: true },
      });

      if (!project) {
        files.forEach((file) => removePhysicalFile(file.path));
        return res
          .status(404)
          .json({ success: false, message: "Project not found" });
      }

      const s3Folder = `project-images/${projectId}`;
      console.log('S3 Folder for upload:', s3Folder);

      const currentCount = await prisma.project_images.count({
        where: { project_id: projectId },
      });

      if (currentCount + files.length > PROJECT_IMAGE_LIMIT) {
        files.forEach((file) => removePhysicalFile(file.path));
        return res.status(400).json({
          success: false,
          message: `You can upload up to ${PROJECT_IMAGE_LIMIT} images per project`,
        });
      }

      const hasDefault = await prisma.project_images.findFirst({
        where: { project_id: projectId, default: 1 },
      });

      // allow client to specify which uploaded file should be default (0-based index)
      const defaultIndexRaw = req.body?.default_index;
      const defaultIndex =
        defaultIndexRaw !== undefined &&
          defaultIndexRaw !== null &&
          defaultIndexRaw !== ""
          ? parseInt(defaultIndexRaw, 10)
          : null;

      // Upload images to S3 or local storage
      const s3Enabled = await isS3Enabled();
      const uploadedPaths = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let imagePath = null;

        if (s3Enabled) {
          try {
            const safeProjectName = String(project.project_name || "")
            .replace(/[^\x20-\x7E]/g, "") // remove non-ASCII
            .replace(/[\r\n]/g, "")       // remove line breaks
            .trim();

            const s3Result = await uploadToS3(
              file.buffer,
              file.originalname,
              file.mimetype,
              {
                folder: s3Folder,
                metadata: {
                  projectId: String(projectId),
                  projectName: safeProjectName,
                  uploadType: 'project_gallery_image',
                  imageIndex: String(i)
                }
              }
            );
            console.log('S3 upload result:', s3Result);
            if (s3Result.success) {
              imagePath = s3Result.data.fileUrl;
            }
          } catch (err) {
            console.error('S3 upload error:', err);
          }
        }

        // Local fallback
        if (!imagePath) {
          const timestamp = Date.now();
          const random = Math.round(Math.random() * 1e9);
          const ext = path.extname(file.originalname) || '.jpg';
          const filename = `project_${timestamp}_${random}${ext}`;
          const localPath = path.join(PROJECT_IMAGES_DIR, filename);
          fs.writeFileSync(localPath, file.buffer);
          imagePath = buildPublicImagePath(filename);
        }

        uploadedPaths.push(imagePath);
      }

      const insertPayload = uploadedPaths.map((imagePath, index) => ({
        project_id: projectId,
        path: imagePath,
        // If a default already exists for the project, all new images are non-default.
        // Otherwise, if client provided default_index use that index, else fall back to first file.
        default: hasDefault
          ? 0
          : defaultIndex !== null && !Number.isNaN(defaultIndex)
            ? index === defaultIndex
              ? 1
              : 0
            : index === 0
              ? 1
              : 0,
      }));

      await prisma.project_images.createMany({
        data: insertPayload,
      });

      if (!hasDefault && insertPayload.length) {
        const chosen =
          insertPayload.find((p) => p.default === 1) || insertPayload[0];
        // await prisma.projects.update({
        //   where: { id: projectId },
        //   data: { project_image: chosen.path },
        // });
      }

      const images = await prisma.project_images.findMany({
        where: { project_id: projectId },
        orderBy: { id: "asc" },
      });

      return res.json({ success: true, data: images });
    } catch (error) {
      console.error("Upload project images error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to upload project images",
        error: error.message,
      });
    }
  }
);

// Set an existing image as default
router.put(
  "/:projectId/images/:imageId/set-default",
  authenticateToken,
  async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId, 10);
      const imageId = parseInt(req.params.imageId, 10);
      if (Number.isNaN(projectId) || Number.isNaN(imageId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid identifiers" });
      }

      const img = await prisma.project_images.findFirst({
        where: { id: imageId, project_id: projectId },
      });
      if (!img) {
        return res
          .status(404)
          .json({ success: false, message: "Image not found" });
      }

      // clear previous default
      await prisma.project_images.updateMany({
        where: { project_id: projectId, default: 1 },
        data: { default: 0 },
      });

      // set target as default
      await prisma.project_images.update({
        where: { id: imageId },
        data: { default: 1 },
      });

      const images = await prisma.project_images.findMany({
        where: { project_id: projectId },
        orderBy: { id: "asc" },
      });

      // set target as default
      await prisma.project_images.update({
        where: { id: imageId },
        data: { default: 1 },
      });

      // update project's main image path
      // await prisma.projects.update({
      //     where: { id: projectId },
      //     data: { project_image: img.path }
      // });

      // const images = await prisma.project_images.findMany({
      //     where: { projectId },
      //     orderBy: { id: 'asc' }
      // });

      return res.json({ success: true, data: images });
    } catch (err) {
      console.error("Set default image error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Failed to set default image" });
    }
  }
);

/**
 * @route   GET /api/projects/:id/images
 * @desc    Fetch gallery images for a project
 * @access  Private
 */
router.get("/:id/images", authenticateToken, async (req, res) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    if (Number.isNaN(projectId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid project id" });
    }

    const images = await prisma.project_images.findMany({
      where: { project_id: projectId },
      orderBy: { id: "asc" },
    });

    return res.json({ success: true, data: images });
  } catch (error) {
    console.error("Fetch project images error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch project images" });
  }
});

/**
 * @route   DELETE /api/projects/:projectId/images/:imageId
 * @desc    Delete a gallery image
 * @access  Private
 */
router.delete(
  "/:projectId/images/:imageId",
  authenticateToken,
  async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId, 10);
      const imageId = parseInt(req.params.imageId, 10);

      if (Number.isNaN(projectId) || Number.isNaN(imageId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid identifiers" });
      }

      const imageRecord = await prisma.project_images.findFirst({
        where: { id: imageId, project_id: projectId },
      });

      await prisma.project_images.delete({
        where: { id: imageRecord.id },
      });

      // Delete from S3 or local storage
      if (imageRecord.path) {
        try {
          let fileKey = imageRecord.path;
          if (fileKey.startsWith('http')) {
            const url = new URL(fileKey);
            fileKey = url.pathname.substring(1);
          }
          await deleteFromS3(fileKey);
          console.log('S3 image file deleted:', fileKey);
        } catch (fileError) {
          console.error('Failed to delete image from S3:', fileError);
          // Fallback: try local delete
          try {
            removePhysicalFile(getAbsoluteImagePath(imageRecord.path));
          } catch (localErr) {
            console.error('Failed to delete local image:', localErr);
          }
        }
      }

      if (imageRecord.default === 1) {
        const nextImage = await prisma.project_images.findFirst({
          where: { project_id: projectId },
          orderBy: { id: "asc" },
        });

        if (nextImage) {
          await prisma.project_images.update({
            where: { id: nextImage.id },
            data: { default: 1 },
          });
        }
      }

      return res.json({ success: true, message: "Image removed" });
    } catch (error) {
      console.error("Delete project image error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to delete project image" });
    }
  }
);

/**
 * @route   GET /api/projects
 * @desc    Get all projects
 * @access  Private
 */
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit,
      search,
      project_status_id,
      offtaker_id,
      project_id,
      downloadAll,
      solisStatus
    } = req.query;
    const pageInt = parseInt(page);
    const offtakerIdInt = offtaker_id ? parseInt(offtaker_id) : null;
    const projectIdInt = project_id ? parseInt(project_id) : null;
    const limitInt = parseInt(limit);
    const offset = (pageInt - 1) * limitInt;

    const parsedLimit = Number(limit);
    const limitNumber = !Number.isNaN(parsedLimit) && parsedLimit > 0 ? parsedLimit : null;
    const fetchAll = downloadAll === "1" || downloadAll === "true" || !limitNumber;

    const where = { is_deleted: 0 };

    // Search functionality - search across project_name, product_code, address_1, address_2, city, state, country
    const trimmedSearch = typeof search === "string" ? search.trim() : "";
    if (trimmedSearch) {
      where.OR = [
        { project_name: { contains: trimmedSearch, mode: "insensitive" } },
        { product_code: { contains: trimmedSearch, mode: "insensitive" } },
        { address_1: { contains: trimmedSearch, mode: "insensitive" } },
        { address_2: { contains: trimmedSearch, mode: "insensitive" } },
        { project_location: { contains: trimmedSearch, mode: "insensitive" } },
        { project_description: { contains: trimmedSearch, mode: "insensitive" } },
        // Correct nested relation field names to match schema
        { offtaker: { full_name: { contains: trimmedSearch, mode: "insensitive" } } },
        { cities: { name: { contains: trimmedSearch, mode: "insensitive" } } },
        { states: { name: { contains: trimmedSearch, mode: "insensitive" } } },
        { countries: { name: { contains: trimmedSearch, mode: "insensitive" } } },
      ];
    }

    // Filter by offtaker
    if (offtakerIdInt) {
      where.offtaker_id = offtakerIdInt;
    }

    // Filter by project
    if (projectIdInt) {
      where.id = projectIdInt;
    }

    // Filter by status (supports single value or comma-separated values)
    if (project_status_id !== undefined && project_status_id !== "") {
      const status_array = String(project_status_id).split(',').map(s => parseInt(s.trim())).filter(s => !isNaN(s));
      if (status_array.length === 1) {
        where.project_status_id = status_array[0];
      } else if (status_array.length > 1) {
        where.project_status_id = { in: status_array };
      }
    }

    // Get total count before applying limit
    let totalCount = await prisma.projects.count({ where });

    const [projects, _] = await Promise.all([
      prisma.projects.findMany({
        where,
        include: {
          offtaker: { select: { id: true, full_name: true, email: true, phone_number: true } },
          cities: true,
          states: true,
          project_status: true,
          countries: true,
          project_types: true,
          project_images: true,
          project_data: true,
          // Include primary investor relation (projects.investor_id)
          interested_investors: { select: { id: true, user_id: true, full_name: true, email: true, phone_number: true } },
          project_inverters: true,
        },
        skip: fetchAll ? 0 : offset,
        take: fetchAll ? undefined : limitInt,
        orderBy: { created_at: "desc" },
      }),
      Promise.resolve(null),
    ]);

    // Fetch dropdown lists (all non-deleted)
    const offtakerList = await prisma.users.findMany({
      where: { is_deleted: 0, role_id: { in: [3] } },
      select: { id: true, full_name: true, email: true },
      orderBy: { full_name: "asc" },
    });

    const projectList = await prisma.projects.findMany({
      where: { is_deleted: 0 },
      orderBy: { project_name: "asc" },
    });

    const effectiveLimit = limitNumber || totalCount;
    const returnedCount = fetchAll ? totalCount : Math.min(totalCount, effectiveLimit);
    const pageSize = 20;

    res.json({
      success: true,
      data: projects,
      offtakerList,
      projectList,
      pagination: {
        page: pageInt,
        limit: fetchAll ? totalCount : effectiveLimit,
        total: returnedCount,
        pages: Math.max(1, Math.ceil(returnedCount / pageSize)),
      },
    });
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

router.put("/:id/status", authenticateToken, async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const newStatus = parseInt(req.body.status);

    //  Update project status
    const updated = await prisma.projects.update({
      where: { id: projectId },
      data: { project_status: { connect: { id: newStatus } } },
    });

    //  Get status name
    const project_status = await prisma.project_status.findFirst({
      where: { id: newStatus },
      select: { name: true },
    });

    const status_name = project_status?.name || "Updated";

    //  Notify offtaker
    if (updated.offtaker_id) {
      const lang = await getUserLanguage(updated.offtaker_id);

      await createNotification({
        userId: updated.offtaker_id,
        title: t(lang, "notification_msg.project_status_title", {
          project_name: updated.project_name,
        }),
        message: t(lang, "notification_msg.project_status_message", {
          project_name: updated.project_name,
          status_name,
        }),
        moduleType: "projects",
        moduleId: updated.id,
        actionUrl: `projects/view/${updated.id}`,
        created_by: 1,
      });
    }

    //  Notify investor (single)
    const investor = await prisma.interested_investors.findFirst({
      where: { project_id: projectId },
      select: { user_id: true },
    });

    if (investor) {
      const lang = await getUserLanguage(investor.user_id);

      await createNotification({
        userId: investor.user_id,
        title: t(lang, "notification_msg.project_status_title", {
          project_name: updated.project_name,
        }),
        message: t(lang, "notification_msg.project_status_message", {
          project_name: updated.project_name,
          status_name,
        }),
        moduleType: "projects",
        moduleId: updated.id,
        actionUrl: `projects/view/${updated.id}`,
        created_by: 1,
      });
    }

    // 5️⃣ Response
    res.json({ success: true, data: updated });

  }
  catch (error) {
    console.error("Update project status error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Update a project by ID
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const projectId = parseInt(id, 10);
    if (Number.isNaN(projectId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid project id" });
    }

    const {
      name,
      project_slug,
      project_type_id,
      offtaker_id,
      address_1,
      address_2,
      country_id,
      state_id,
      city_id,
      zipcode,
      asking_price,
      lease_term,
      product_code,
      project_description,
      investor_profit = "0",
      weshare_profit = "0",
      project_size,
      project_close_date,
      project_location,
      weshare_price_kwh,
      evn_price_kwh,
      project_status_id,
      solis_plant_id,
    } = req.body;


    const existingProject = await prisma.projects.findFirst({
      where: { id: projectId },
      select: {
        project_status: true,
        offtaker_id: true,
        project_name: true,
      },
    });

    if (!existingProject) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const old_status = existingProject?.project_status?.id;

    const updateData = {
      ...(name !== undefined && { project_name: name }),
      ...(solis_plant_id !== undefined && { solis_plant_id: solis_plant_id || null }),
      // update relation: connect projectType by id when provided
      ...(project_type_id !== undefined &&
        (project_type_id
          ? { project_types: { connect: { id: parseInt(project_type_id) } } }
          : { project_types: { disconnect: true } })),
      ...(offtaker_id !== undefined &&
        (offtaker_id
          ? { offtaker: { connect: { id: parseInt(offtaker_id) } } }
          : { offtaker: { disconnect: true } })),
      ...(address_1 !== undefined && { address_1 }),
      ...(address_2 !== undefined && { address_2 }),
      ...(country_id !== undefined &&
        (country_id
          ? { countries: { connect: { id: parseInt(country_id) } } }
          : { countries: { disconnect: true } })),
      ...(state_id !== undefined &&
        (state_id
          ? { states: { connect: { id: parseInt(state_id) } } }
          : { states: { disconnect: true } })),
      ...(city_id !== undefined &&
        (city_id
          ? { cities: { connect: { id: parseInt(city_id) } } }
          : { cities: { disconnect: true } })),
      ...(zipcode !== undefined && { zipcode }),
      ...(asking_price !== undefined && { asking_price: asking_price || "" }),
      ...(lease_term !== undefined && {
        lease_term:
          lease_term !== null && `${lease_term}` !== ""
            ? parseInt(lease_term)
            : null,
      }),
      ...(product_code !== undefined && { product_code: product_code || "" }),
      ...(project_description !== undefined && {
        project_description: project_description || "",
      }),
      ...(investor_profit !== undefined && { investor_profit }),
      ...(weshare_profit !== undefined && { weshare_profit }),
      ...(project_size !== undefined && { project_size: project_size || "" }),
      ...(project_close_date !== undefined && {
        project_close_date: project_close_date
          ? new Date(project_close_date)
          : null,
      }),
      ...(project_location !== undefined && {
        project_location: project_location || "",
      }),
      ...(project_status_id !== undefined &&
        (project_status_id
          ? { project_status: { connect: { id: parseInt(project_status_id) } } }
          : { project_status: { disconnect: true } })),
      ...(weshare_price_kwh !== undefined && { weshare_price_kwh: parseFloat(weshare_price_kwh) || null }),
      ...(evn_price_kwh !== undefined && { evn_price_kwh: parseFloat(evn_price_kwh) || null }),
    };

    if (project_slug !== undefined) {
      const baseSlug = slugify(project_slug || name || "");
      updateData.project_slug = await ensureUniqueSlug(baseSlug, projectId);
    }

    const updated = await prisma.projects.update({
      where: { id: projectId },
      data: updateData,
      include: {
        offtaker: { select: { id: true, full_name: true, email: true, phone_number: true } },
        cities: true,
        states: true,
        countries: true,
        project_types: true,
        project_status: true,
      },
    });

    const new_status = updated?.project_status?.id;

    if (project_status_id !== undefined && old_status !== null && new_status !== null && old_status !== new_status) {
      const project_status = await prisma.project_status.findFirst({
        where: { id: new_status },
        select: { name: true },
      });

      const status_name = project_status?.name;

      const lang = await getUserLanguage(updated.offtaker_id);

      const notification_title = t(lang, 'notification_msg.project_status_title', {
        project_name: updated.project_name
      });

      const notification_message = t(lang, 'notification_msg.project_status_message', {
        project_name: updated.project_name,
        status_name: status_name,
      });

      await createNotification({
        userId: updated.offtaker_id,
        title: notification_title,
        message: notification_message,
        moduleType: 'projects',
        moduleId: updated.id,
        actionUrl: `projects/view/${updated.id}`,
        created_by: 1,
      });

      const investor = await prisma.interested_investors.findFirst({
        where: { project_id: projectId },
        select: { user_id: true },
      });

      if (investor) {
        // single user → single language
        const lang = await getUserLanguage(investor.user_id);

        const notification_title = t(lang, 'notification_msg.project_status_title', {
          project_name: updated.project_name,
        }
        );

        const notification_message = t(lang, 'notification_msg.project_status_message',
          {
            project_name: updated.project_name,
            status_name: status_name,
          }
        );

        await createNotification({
          userId: investor.user_id,
          title: notification_title,
          message: notification_message,
          moduleType: 'projects',
          moduleId: updated.id,
          actionUrl: `projects/view/${updated.id}`,
          created_by: 1,
        });
      }
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    if (
      error.code === "P2002" &&
      error.meta?.target?.includes("project_slug")
    ) {
      return res.status(409).json({
        success: false,
        message: "Project slug already exists. Please choose a different slug.",
      });
    }

    console.error("Update project error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Insert a Meter by ID
router.put("/meter/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      meter_url,
      sim_number,
      sim_start_date,
      sim_expire_date,
    } = req.body;
    console.log("Data::", req.body);

    const updated = await prisma.projects.update({
      where: { id: parseInt(id) },
      data: {
        ...(meter_url !== undefined && { meter_url }),
        ...(sim_number !== undefined && { sim_number }),
        ...(sim_start_date !== undefined && {
          sim_start_date: sim_start_date ? new Date(sim_start_date) : null,
        }),
        ...(sim_expire_date !== undefined && {
          sim_expire_date: sim_expire_date ? new Date(sim_expire_date) : null,
        }),
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Get a Meter by ID
router.get("/meter/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const meter = await prisma.projects.findFirst({
      where: { id: parseInt(id) },
      select: {
        meter_url: true,
        sim_number: true,
        sim_start_date: true,
        sim_expire_date: true,
      },
    });
    if (!meter) {
      return res
        .status(404)
        .json({ success: false, message: "Meter not found" });
    }
    res.json({ success: true, data: meter });
  } catch (error) {
    console.error("Get meter error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Delete a project by ID
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const projectId = parseInt(id, 10);
    if (Number.isNaN(projectId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid project id" });
    }

    // Fetch all images for project, remove physical files
    const images = await prisma.project_images.findMany({
      where: { project_id: projectId },
    });

    images.forEach((img) => {
      if (img.path) {
        try {
          // Check if it's an S3 URL
          if (img.path.startsWith('http')) {
            const url = new URL(img.path);
            const key = decodeURIComponent(url.pathname.substring(1));
            deleteFromS3(key)
              .then(() => console.log('S3 image deleted:', key))
              .catch((err) => console.error('Failed to delete S3 image:', err));
          } else {
            // Local file deletion
            removePhysicalFile(getAbsoluteImagePath(img.path));
          }
        } catch (e) {
          console.warn(
            "Failed removing physical file for image:",
            img.path,
            e.message
          );
        }
      }
    });

    // Delete image records from DB
    await prisma.project_images.deleteMany({
      where: { project_id: projectId },
    });

    // Delete inverter_data rows for this project
    await prisma.inverter_data.deleteMany({
      where: { project_id: projectId },
    });

    await prisma.contracts.updateMany({
      where: { project_id: projectId },
      data: { is_deleted: 1 },
    });

    await prisma.interested_investors.updateMany({
      where: { project_id: projectId },
      data: { is_deleted: 1 },
    });

    // Soft-delete project_inverters rows for this project (mark soft_delete = 1)
    await prisma.project_inverters.updateMany({
      where: { project_id: projectId },
      data: { is_deleted: 1 },
    });

    // Soft-delete project (keep behaviour as before)
    await prisma.projects.update({
      where: { id: projectId },
      data: { is_deleted: 1 },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});


// Project Chart Data Is Get
router.post("/chart-data", async (req, res) => {
  try {
    const { projectId, date } = req.body;

    // Build WHERE condition step-by-step
    let where = {
      project_id: { is_deleted: 0 },
    };

    // Filter by projectId if provided
    if (projectId) {
      where.project_id = Number(projectId);
    }

    // Filter by date if provided (expecting YYYY-MM-DD)
    if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      where.date = {
        gte: new Date(`${date}T00:00:00.000Z`),
        lte: new Date(`${date}T23:59:59.999Z`),
      };
    }

    const allData = await prisma.project_energy_data.findMany({
      where,
      orderBy: { date: "asc" },
    });
    return res.json({
      success: true,
      count: allData.length,
      data: allData,
    });

  } catch (error) {
    console.error("Error fetching latest inverter data:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/chart_month_data", async (req, res) => {
  try {
    const { projectId, year, month } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: "Project Id required parameters" });
    }

    // Use provided year/month or default to current month
    const selectedYear = year || dayjs().format('YYYY');
    const selectedMonth = month || dayjs().format('MM');

    const month_year = `${selectedYear}-${selectedMonth}`;

    const startDate = dayjs(`${month_year}`)
      .startOf("month")
      .format("YYYY-MM-DD");

    const endDate = dayjs(`${month_year}-01`)
      .endOf("month")
      .format("YYYY-MM-DD");

    const data = await prisma.project_energy_days_data.findMany({
      where: {
        project_id: Number(projectId),
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    return res.json({
      success: true,
      count: data.length,
      data: data,
    });


  } catch (error) {
    console.error("Error fetching latest inverter data:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/chart_year_data", async (req, res) => {
  try {
    const { projectId, year } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: "Project Id required parameters" });
    }

    const selectedYear = year || dayjs().format("YYYY");

    // ✅ FULL YEAR RANGE
    const startDate = dayjs(`${selectedYear}-01-01`)
      .startOf("day")
      .format("YYYY-MM-DD");

    const endDate = dayjs(`${selectedYear}-12-31`)
      .endOf("day")
      .format("YYYY-MM-DD");

    const data = await prisma.project_energy_days_data.findMany({
      where: {
        project_id: Number(projectId),
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    return res.json({
      success: true,
      year: selectedYear,
      count: data.length,
      data,
    });

  } catch (error) {
    console.error("Error fetching year chart data:", error);
    return res.status(500).json({ error: "Server error" });
  }
});


router.post("/electricity/monthly-cost-chart", async (req, res) => {
  try {
    const { projectId, year } = req.body;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "Project Id is required",
      });
    }

    const selectedYear = year || dayjs().format("YYYY");

    const project = await prisma.projects.findFirst({
      where: { id: Number(projectId) },
      select: {
        evn_price_kwh: true,
        weshare_price_kwh: true,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const energyData = await prisma.project_energy_days_data.findMany({
      where: {
        project_id: Number(projectId),
        date: {
          gte: new Date(`${selectedYear}-01-01T00:00:00.000Z`),
          lte: new Date(`${selectedYear}-12-31T23:59:59.999Z`),
        },
      },
      select: {
        date: true,
        energy: true,
      },
    });

    // 🔹 Monthly aggregation
    const monthlyMap = {};

    energyData.forEach((row) => {
      const monthIndex = new Date(row.date).getMonth(); // 0–11

      if (!monthlyMap[monthIndex]) {
        monthlyMap[monthIndex] = 0;
      }

      monthlyMap[monthIndex] += Number(row.energy) || 0;
    });

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    const chartData = monthNames.map((month, index) => {
      const totalKwh = monthlyMap[index] || 0;

      const evnAmount =
        totalKwh * (Number(project.evn_price_kwh) || 0);

      const weshareAmount =
        totalKwh * (Number(project.weshare_price_kwh) || 0);

      return {
        month,
        evn: Number(evnAmount.toFixed(2)),
        weshare: Number(weshareAmount.toFixed(2)),
        saving: Number((evnAmount - weshareAmount).toFixed(2)),
      };
    });

    return res.json({
      success: true,
      year: selectedYear,
      data: chartData,
    });
  } catch (error) {
    console.error("Error fetching monthly electricity cost data:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});


router.post('/electricity/overview-chart', async (req, res) => {
  try {
    const { projectId, type, date } = req.body;

    if (!projectId || !type) {
      return res.status(400).json({ message: 'Missing parameters' });
    }

    const project = await prisma.projects.findFirst({
      where: { id: Number(projectId) },
      select: {
        evn_price_kwh: true,
        weshare_price_kwh: true,
      },
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    let startDate, endDate, groupBy;

    // ================= DAY (1 month → daily)
    if (type === 'day') {
      startDate = new Date(`${date}-01`);
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      groupBy = 'day';
    }

    // ================= MONTH (1 year → monthly)
    if (type === 'month') {
      startDate = new Date(`${date}-01-01`);
      endDate = new Date(`${date}-12-31`);
      groupBy = 'month';
    }

    // ================= YEAR (all years → yearly)
    if (type === 'year') {
      startDate = new Date('2000-01-01');
      endDate = new Date();
      groupBy = 'year';
    }

    const rows = await prisma.project_energy_days_data.findMany({
      where: {
        project_id: Number(projectId),
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        date: true,
        energy: true,
      },
      orderBy: { date: 'asc' },
    });

    const resultMap = {};

    rows.forEach((row) => {
      let key;

      if (groupBy === 'day') {
        key = row.date.toISOString().slice(0, 10);
      }
      if (groupBy === 'month') {
        key = row.date.toISOString().slice(0, 7);
      }
      if (groupBy === 'year') {
        key = row.date.getFullYear().toString();
      }

      if (!resultMap[key]) {
        resultMap[key] = { evn: 0, weshare: 0, saving: 0 };
      }

      const energy = Number(row.energy) || 0;
      const evnPrice = Number(project.evn_price_kwh) || 0;
      const wesharePrice = Number(project.weshare_price_kwh) || 0;

      const evnAmount = energy * evnPrice;
      const weshareAmount = energy * wesharePrice;

      resultMap[key].evn += evnAmount;
      resultMap[key].weshare += weshareAmount;
      resultMap[key].saving += (evnAmount - weshareAmount);
    });

    const data = Object.keys(resultMap).map((key) => ({
      label: key,
      evn: resultMap[key].evn,
      weshare: resultMap[key].weshare,
      saving: resultMap[key].saving
    }));

    return res.json({
      success: true,
      data: data,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/dropdown/project', authenticateToken, async (req, res) => {
  try {
    const { offtaker_id, project_status_id, investor_id } = req.body;

    let where = {
      is_deleted: 0,
    };

    if (offtaker_id) {
      where.offtaker_id = offtaker_id;
    }

    if (project_status_id) {
      where.project_status_id = parseInt(project_status_id);
    }

    if (investor_id) {
      where.investor_id = parseInt(investor_id);
    }

    const projects = await prisma.projects.findMany({
      where,
      select: {
        id: true,
        project_name: true,
        investor_profit: true,
        offtaker_id: true,

        offtaker: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone_number: true,
          },
        },

        investor: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone_number: true,
          },
        },
      },
      orderBy: {
        project_name: 'asc',
      },
    });

    res.status(200).json({
      success: true,
      data: projects,
      count: projects.length,
    });

  } catch (error) {
    console.error("Error fetching projects dropdown:", error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});


router.get("/report/project-day-data", authenticateToken, async (req, res) => {
  try {
    const {
      projectId,
      search,
      downloadAll,
      limit,
      page,
      startDate,
      endDate,
    } = req.query;

    const limitNumber = Number(limit) > 0 ? Number(limit) : 50;
    const pageNumber = Number(page) > 0 ? Number(page) : 1;
    const fetchAll = downloadAll === "1" || downloadAll === "true";

    let where = {
      projects: { is_deleted: 0 },
    };

    // ✅ Project filter
    if (projectId) {
      where.project_id = Number(projectId);
    }

    // Date filter
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    // SEARCH FIX (IMPORTANT PART)
    if (search) {
      const trimmed = search.trim();
      const searchNumber = Number(trimmed);
      const hasDecimal = trimmed.includes(".");
      const numericConditions = [];

      if (!isNaN(searchNumber)) {
        if (hasDecimal) {
          // exact decimal search
          numericConditions.push(
            { energy: { equals: searchNumber } },
            { grid_purchased_energy: { equals: searchNumber } },
            { consume_energy: { equals: searchNumber } }
          );
        } else {
          // integer → range search (138 → 138.x)
          numericConditions.push(
            {
              energy: {
                gte: searchNumber,
                lt: searchNumber + 1,
              },
            },
            {
              grid_purchased_energy: {
                gte: searchNumber,
                lt: searchNumber + 1,
              },
            },
            {
              consume_energy: {
                gte: searchNumber,
                lt: searchNumber + 1,
              },
            }
          );
        }
      }

      where.OR = [
        {
          projects: {
            project_name: {
              contains: trimmed,
              mode: "insensitive",
            },
          },
        },
        ...numericConditions,
      ];
    }

    // TOTAL COUNT
    const totalCount = await prisma.project_energy_days_data.count({
      where,
    });

    // DATA FETCH
    const data = await prisma.project_energy_days_data.findMany({
      where,
      include: {
        projects: {
          select: {
            id: true,
            project_name: true,
            project_slug: true,
            weshare_price_kwh: true,
            evn_price_kwh: true,
          },
        },
      },
      orderBy: { date: "desc" },
      skip: fetchAll ? 0 : (pageNumber - 1) * limitNumber,
      take: fetchAll ? undefined : limitNumber,
    });

    // CALCULATIONS
    const dataWithCalculations = data.map((row) => {
      const wesharePrice = Number(row.projects?.weshare_price_kwh) || 0;
      const evnPrice = Number(row.projects?.evn_price_kwh) || 0;
      const energy = Number(row.energy) || 0;

      const weshare_amount = energy * wesharePrice;
      const evn_amount = energy * evnPrice;
      const saving_cost = evn_amount - weshare_amount;

      return {
        ...row,
        weshare_amount,
        evn_amount,
        saving_cost,
      };
    });

    res.status(200).json({
      success: true,
      data: dataWithCalculations,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNumber),
      },
    });
  } catch (error) {
    console.error("Project day data error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch project day data",
    });
  }
}
);

router.get("/report/saving-data", authenticateToken, async (req, res) => {
  try {
    const {
      projectId,
      offtaker_id,
      search,
      downloadAll,
      limit,
      page,
      startDate,
      endDate,
      groupBy,
    } = req.query;

    const limitNumber = Number(limit) > 0 ? Number(limit) : 50;
    const pageNumber = Number(page) > 0 ? Number(page) : 1;
    const fetchAll = downloadAll === "1" || downloadAll === "true";

    let where = {
      projects: {
        is_deleted: 0,
        ...(offtaker_id ? { offtaker_id: Number(offtaker_id) } : {}),
      },
    };


    if (projectId) {
      where.project_id = Number(projectId);
    }

    // Date filter
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    // SEARCH FIX (IMPORTANT PART)
    if (search) {
      const trimmed = search.trim();
      const searchNumber = Number(trimmed);
      const hasDecimal = trimmed.includes(".");
      const numericConditions = [];

      if (!isNaN(searchNumber)) {
        if (hasDecimal) {
          // exact decimal search
          numericConditions.push(
            { energy: { equals: searchNumber } },
            { grid_purchased_energy: { equals: searchNumber } },
            { consume_energy: { equals: searchNumber } }
          );
        } else {
          // integer → range search (138 → 138.x)
          numericConditions.push(
            {
              energy: {
                gte: searchNumber,
                lt: searchNumber + 1,
              },
            },
            {
              grid_purchased_energy: {
                gte: searchNumber,
                lt: searchNumber + 1,
              },
            },
            {
              consume_energy: {
                gte: searchNumber,
                lt: searchNumber + 1,
              },
            }
          );
        }
      }

      where.OR = [
        {
          projects: {
            project_name: {
              contains: trimmed,
              mode: "insensitive",
            },
          },
        },
        ...numericConditions,
      ];
    }

    // If grouping by month, we need to fetch ALL data first, then group
    // Otherwise, use pagination as usual
    const shouldFetchAllForGrouping = groupBy === "month";

    // TOTAL COUNT
    const totalCount = await prisma.project_energy_days_data.count({
      where,
    });

    // DATA FETCH
    const data = await prisma.project_energy_days_data.findMany({
      where,
      include: {
        projects: {
          select: {
            id: true,
            project_name: true,
            project_slug: true,
            weshare_price_kwh: true,
            evn_price_kwh: true,
          },
        },
      },
      orderBy: { date: "desc" },
      skip: shouldFetchAllForGrouping ? 0 : (fetchAll ? 0 : (pageNumber - 1) * limitNumber),
      take: shouldFetchAllForGrouping ? undefined : (fetchAll ? undefined : limitNumber),
    });

    // CALCULATIONS
    let dataWithCalculations = data.map((row) => {
      const wesharePrice = Number(row.projects?.weshare_price_kwh) || 0;
      const evnPrice = Number(row.projects?.evn_price_kwh) || 0;
      const energy = Number(row.energy) || 0;

      const weshare_amount = energy * wesharePrice;
      const evn_amount = energy * evnPrice;
      const saving_cost = evn_amount - weshare_amount;

      return {
        ...row,
        weshare_amount,
        evn_amount,
        saving_cost,
      };
    });

    // GROUP BY MONTH IF REQUESTED
    if (groupBy === "month") {
      // Group data by project_id and month
      const monthGroups = {};

      dataWithCalculations.forEach((row) => {
        const date = new Date(row.date);
        const year = date.getFullYear();
        const month = date.getMonth(); // 0-11
        const monthKey = `${row.project_id}-${year}-${month}`;

        if (!monthGroups[monthKey]) {
          // Format date as MM/YYYY (e.g., "01/2026")
          const monthStr = String(month + 1).padStart(2, '0');
          const yearStr = String(year);
          monthGroups[monthKey] = {
            id: monthKey,
            project_id: row.project_id,
            projects: row.projects,
            date: `${monthStr}/${yearStr}`,
            energy: 0,
            grid_purchased_energy: 0,
            consume_energy: 0,
            full_hour: 0,
            battery_charge_energy: 0,
            battery_discharge_energy: 0,
            home_grid_energy: 0,
            back_up_energy: 0,
            weshare_amount: 0,
            evn_amount: 0,
            saving_cost: 0,
            created_at: row.created_at,
          };
        }

        // Sum all numeric fields
        monthGroups[monthKey].energy += Number(row.energy) || 0;
        monthGroups[monthKey].grid_purchased_energy += Number(row.grid_purchased_energy) || 0;
        monthGroups[monthKey].consume_energy += Number(row.consume_energy) || 0;
        monthGroups[monthKey].full_hour += Number(row.full_hour) || 0;
        monthGroups[monthKey].battery_charge_energy += Number(row.battery_charge_energy) || 0;
        monthGroups[monthKey].battery_discharge_energy += Number(row.battery_discharge_energy) || 0;
        monthGroups[monthKey].home_grid_energy += Number(row.home_grid_energy) || 0;
        monthGroups[monthKey].back_up_energy += Number(row.back_up_energy) || 0;
        monthGroups[monthKey].weshare_amount += Number(row.weshare_amount) || 0;
        monthGroups[monthKey].evn_amount += Number(row.evn_amount) || 0;
        monthGroups[monthKey].saving_cost += Number(row.saving_cost) || 0;
      });

      // Convert grouped object to array and sort by date (newest first)
      // Parse MM/YYYY format for sorting
      const allMonths = Object.values(monthGroups).sort((a, b) => {
        // Parse MM/YYYY format (e.g., "01/2026")
        const parseMonthYear = (str) => {
          const [month, year] = str.split('/').map(Number);
          return new Date(year, month - 1, 1); // month is 0-indexed in Date constructor
        };
        const dateA = parseMonthYear(a.date);
        const dateB = parseMonthYear(b.date);
        return dateB - dateA;
      });

      // Apply pagination to grouped months
      const paginatedMonths = fetchAll
        ? allMonths
        : allMonths.slice((pageNumber - 1) * limitNumber, pageNumber * limitNumber);

      res.status(200).json({
        success: true,
        data: paginatedMonths,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total: allMonths.length,
          pages: Math.ceil(allMonths.length / limitNumber),
        },
      });
    } else {
      // Original day-based response
      res.status(200).json({
        success: true,
        data: dataWithCalculations,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total: totalCount,
          pages: Math.ceil(totalCount / limitNumber),
        },
      });
    }
  } catch (error) {
    console.error("Project day data error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch project day data",
    });
  }
}
);

// Project Energy Real Time Data 
router.post('/report/project-energy-data', authenticateToken, async (req, res) => {
  try {
    const {
      projectId,
      offtaker_id,
      search,
      downloadAll,
      limit,
      page,
      startDate,
      endDate,
    } = req.query;
    console.log("Req::", req.query)

    const limitNumber = Number(limit) > 0 ? Number(limit) : 50;
    const pageNumber = Number(page) > 0 ? Number(page) : 1;
    const fetchAll = downloadAll === "1" || downloadAll === "true";


    let where = {
      projects: {
        is_deleted: 0,
        ...(offtaker_id ? { offtaker_id: Number(offtaker_id) } : {}),
      },
    };

    if (projectId) {
      where.project_id = Number(projectId);
    }

    if (startDate || endDate) {
      where.date = {};

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        where.date.gte = start;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    if (search) {
      const trimmed = search.trim();
      const searchNumber = Number(trimmed);
      const hasColon = trimmed.includes(":");

      const orConditions = [
        {
          projects: {
            project_name: {
              contains: trimmed,
              mode: "insensitive",
            },
          },
        },
      ];

      // numeric search for pv / grid / load
      if (!isNaN(searchNumber)) {
        orConditions.push(
          { pv: { equals: searchNumber } },
          { grid: { equals: searchNumber } },
          { load: { equals: searchNumber } },
        );
      }

      // time search like "12:40:00"
      if (hasColon) {
        orConditions.push({
          time: {
            contains: trimmed,
          },
        });
      } else {
        orConditions.push({
          time: {
            startsWith: trimmed,
          },
        });
      }

      where.OR = orConditions;
    }

    const totalCount = await prisma.project_energy_data.count({ where });

    const data = await prisma.project_energy_data.findMany({
      where,
      include: {
        projects: {
          select: {
            id: true,
            project_name: true,
            project_slug: true,
            weshare_price_kwh: true,
            evn_price_kwh: true,
          },
        },
      },
      orderBy: { id: "desc" },
      skip: fetchAll ? 0 : (pageNumber - 1) * limitNumber,
      take: fetchAll ? undefined : limitNumber,
    });

    res.status(200).json({
      success: true,
      data,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNumber),
      },
    });
  } catch (error) {
    console.error("Project energy data error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch project energy data",
    });
  }
});


// Project_status
router.get('/status', async (req, res) => {
  try {
    const project_status = await prisma.project_status.findMany({
      where: {
        is_deleted: 0,
      },
    });

    res.status(200).json({
      success: true,
      data: project_status,
    });
  } catch (error) {
    console.error("Project status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch project status",
    });
  }
});


// This /:identifier api set last in code  
router.get("/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;

    console.log("identifier", identifier);

    // Check if identifier is numeric (ID) or string (slug)
    const isNumeric = /^\d+$/.test(identifier);

    const project = await prisma.projects.findFirst({
      where: isNumeric
        ? { id: parseInt(identifier) }
        : { project_slug: identifier },
      include: {
        offtaker: { select: { id: true, full_name: true, email: true, phone_number: true } },
        cities: true,
        states: true,
        countries: true,
        project_types: true,
        project_status: true,
        project_images: true,
        project_data: true,
        interested_investors: { select: { id: true, full_name: true, email: true, phone_number: true, user_id: true } },
        project_inverters: true,
      },
    });

    if (!project) {
      return res
        .status(404)
        .json({ success: false, message: "Project not found" });
    }

    res.json({ success: true, data: project });
  } catch (error) {
    console.error("Get project by identifier error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});


export default router;
