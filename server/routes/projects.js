import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import prisma from "../utils/prisma.js";
import { authenticateToken } from "../middleware/auth.js";

const PROJECT_IMAGE_LIMIT = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const PROJECT_IMAGES_DIR = path.resolve(
  process.cwd(),
  "public",
  "images",
  "projects"
);

fs.mkdirSync(PROJECT_IMAGES_DIR, { recursive: true });

const projectImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, PROJECT_IMAGES_DIR);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || "";
    cb(null, `project_${timestamp}_${random}${ext}`);
  },
});

const projectImageUpload = multer({
  storage: projectImageStorage,
  limits: { fileSize: MAX_IMAGE_SIZE, files: PROJECT_IMAGE_LIMIT },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

const buildPublicImagePath = (filename) => `/images/projects/${filename}`;

const getAbsoluteImagePath = (relativePath) => {
  if (!relativePath) return "";
  const normalized = relativePath.startsWith("/public/")
    ? relativePath.replace("/public", "")
    : relativePath;
  return path.resolve(process.cwd(), "public", normalized.replace(/^\//, ""));
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
    desiredSlug && desiredSlug.trim() ? desiredSlug.trim() : `project-${Date.now()}`;
  let candidate = base;
  let suffix = 1;
  let isUnique = false;

  while (!isUnique) {
    const existing = await prisma.project.findFirst({
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

    const existingProject = await prisma.project.findFirst({
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
      address1,
      address2,
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
      status = 1,
    } = req.body;

    if (!name || !project_type_id) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    const baseSlug = slugify(project_slug || name);
    const uniqueSlug = await ensureUniqueSlug(baseSlug);

    const project = await prisma.project.create({
      data: {
        project_name: name,
        project_slug: uniqueSlug,
        ...(project_type_id && { projectType: { connect: { id: parseInt(project_type_id) } } }),
        ...(offtaker_id && { offtaker: { connect: { id: parseInt(offtaker_id) } } }),
        address1: address1 || "",
        address2: address2 || "",
        ...(country_id && { country: { connect: { id: parseInt(country_id) } } }),
        ...(state_id && { state: { connect: { id: parseInt(state_id) } } }),
        ...(city_id && { city: { connect: { id: parseInt(city_id) } } }),
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
        status: parseInt(status),
      },
      include: {
        country: true,
        state: true,
        city: true,
        offtaker: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: project,
    });
  } catch (error) {
    if (error.code === "P2002" && error.meta?.target?.includes("project_slug")) {
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
        return res
          .status(400)
          .json({
            success: false,
            message: "Please attach at least one image",
          });
      }

      const currentCount = await prisma.project_images.count({
        where: { projectId },
      });

      if (currentCount + files.length > PROJECT_IMAGE_LIMIT) {
        files.forEach((file) => removePhysicalFile(file.path));
        return res.status(400).json({
          success: false,
          message: `You can upload up to ${PROJECT_IMAGE_LIMIT} images per project`,
        });
      }

      const hasDefault = await prisma.project_images.findFirst({
        where: { projectId, default: 1 },
      });

      // allow client to specify which uploaded file should be default (0-based index)
      const defaultIndexRaw = req.body?.default_index;
      const defaultIndex =
        defaultIndexRaw !== undefined &&
        defaultIndexRaw !== null &&
        defaultIndexRaw !== ""
          ? parseInt(defaultIndexRaw, 10)
          : null;

      const insertPayload = files.map((file, index) => ({
        projectId,
        path: buildPublicImagePath(path.basename(file.path)),
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

      const images = await prisma.project_images.findMany({
        where: { projectId },
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
        where: { id: imageId, projectId },
      });
      if (!img) {
        return res
          .status(404)
          .json({ success: false, message: "Image not found" });
      }

      // clear previous default
      await prisma.project_images.updateMany({
        where: { projectId, default: 1 },
        data: { default: 0 },
      });

      // set target as default
      await prisma.project_images.update({
        where: { id: imageId },
        data: { default: 1 },
      });

      const images = await prisma.project_images.findMany({
        where: { projectId },
        orderBy: { id: "asc" },
      });

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
      where: { projectId },
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
        where: { id: imageId, projectId },
      });

      if (!imageRecord) {
        return res
          .status(404)
          .json({ success: false, message: "Image not found" });
      }

      await prisma.project_images.delete({
        where: { id: imageRecord.id },
      });

      removePhysicalFile(getAbsoluteImagePath(imageRecord.path));

      if (imageRecord.default === 1) {
        const nextImage = await prisma.project_images.findFirst({
          where: { projectId },
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
    const { page = 1, limit = 10, search, status, offtaker_id } = req.query;
    const pageInt = parseInt(page);
    const offtakerIdInt = offtaker_id ? parseInt(offtaker_id) : "";
    const limitInt = parseInt(limit);
    const offset = (pageInt - 1) * limitInt;

    const where = { is_deleted: 0 };

    // Optional filters
    if (search) {
      where.OR = [
        { project_name: { contains: search, mode: "insensitive" } },
        {
          projectType: { type_name: { contains: search, mode: "insensitive" } },
        },
      ];
    }

    if (offtakerIdInt) {
      where.offtaker_id = offtakerIdInt;
    }

    if (status !== undefined) {
      where.status = parseInt(status);
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          offtaker: {
            select: { fullName: true, email: true },
          },
          city: true,
          state: true,
          country: true,
          projectType: true,
          project_images: true,
        },
        skip: offset,
        take: limitInt,
        orderBy: { id: "asc" },
      }),
      prisma.project.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        projects,
        pagination: {
          page: pageInt,
          limit: limitInt,
          total,
          pages: Math.ceil(total / limitInt),
        },
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
    const { id } = req.params;
    const { status } = req.body;

    const updated = await prisma.project.update({
      where: { id: parseInt(id) },
      data: { status: parseInt(status) },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update project status error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Get a single project by ID or Slug
router.get("/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;

    // Check if identifier is numeric (ID) or string (slug)
    const isNumeric = /^\d+$/.test(identifier);

    const project = await prisma.project.findUnique({
      where: isNumeric
        ? { id: parseInt(identifier) }
        : { project_slug: identifier },
      include: {
        offtaker: { select: { id: true, fullName: true, email: true } },
        city: true,
        state: true,
        country: true,
        projectType: true,
        project_images: true,
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

// Update a project by ID
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const projectId = parseInt(id, 10);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ success: false, message: "Invalid project id" });
    }

    const {
      name,
      project_slug,
      project_type_id,
      offtaker_id,
      address1,
      address2,
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
      status,
    } = req.body;

    const updateData = {
      ...(name !== undefined && { project_name: name }),
      // update relation: connect projectType by id when provided
      ...(project_type_id !== undefined && (
        project_type_id
          ? { projectType: { connect: { id: parseInt(project_type_id) } } }
          : { projectType: { disconnect: true } }
      )),
      ...(offtaker_id !== undefined && (
        offtaker_id
          ? { offtaker: { connect: { id: parseInt(offtaker_id) } } }
          : { offtaker: { disconnect: true } }
      )),
      ...(address1 !== undefined && { address1 }),
      ...(address2 !== undefined && { address2 }),
      ...(country_id !== undefined && (
        country_id
          ? { country: { connect: { id: parseInt(country_id) } } }
          : { country: { disconnect: true } }
      )),
      ...(state_id !== undefined && (
        state_id
          ? { state: { connect: { id: parseInt(state_id) } } }
          : { state: { disconnect: true } }
      )),
      ...(city_id !== undefined && (
        city_id
          ? { city: { connect: { id: parseInt(city_id) } } }
          : { city: { disconnect: true } }
      )),
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
        project_close_date: project_close_date ? new Date(project_close_date) : null,
      }),
      ...(project_location !== undefined && {
        project_location: project_location || "",
      }),
      ...(status !== undefined && { status: parseInt(status) }),
    };

    if (project_slug !== undefined) {
      const baseSlug = slugify(project_slug || name || "");
      updateData.project_slug = await ensureUniqueSlug(baseSlug, projectId);
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
      include: {
        offtaker: { select: { id: true, fullName: true, email: true } },
        city: true,
        state: true,
        country: true,
        projectType: true,
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    if (error.code === "P2002" && error.meta?.target?.includes("project_slug")) {
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
      meter_name,
      meter_number,
      sim_number,
      sim_start_date,
      sim_expire_date,
    } = req.body;
    console.log("Data::", req.body);

    const updated = await prisma.project.update({
      where: { id: parseInt(id) },
      data: {
        ...(meter_name !== undefined && { meter_name }),
        ...(meter_number !== undefined && { meter_number }),
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
    const meter = await prisma.project.findUnique({
      where: { id: parseInt(id) },
      select: {
        meter_name: true,
        meter_number: true,
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
      where: { projectId },
    });

    images.forEach((img) => {
      try {
        removePhysicalFile(getAbsoluteImagePath(img.path));
      } catch (e) {
        console.warn(
          "Failed removing physical file for image:",
          img.path,
          e.message
        );
      }
    });

    // Delete image records from DB
    await prisma.project_images.deleteMany({
      where: { projectId },
    });

    // Soft-delete project (keep behaviour as before)
    await prisma.project.update({
      where: { id: projectId },
      data: { is_deleted: 1 },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Delete project error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete project" });
  }
});

export default router;
