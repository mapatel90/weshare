import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import prisma from "../utils/prisma.js";
import { authenticateToken } from "../middleware/auth.js";
import dayjs from "dayjs";

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
      status = 1,
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
        status: parseInt(status),
        updated_at: new Date()
      },
      include: {
        countries: true,
        states: true,
        cities: true,
        offtaker: {
          select: { id: true, full_name: true, email: true },
        },
        interested_investors: {
          select: { id: true, full_name: true, email: true, phone_number: true },
        },
      },
    });

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

      const currentCount = await prisma.project_images.count({
        where: { project_id: projectId },
      });

      console.log("currentCount", currentCount);

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

      const insertPayload = files.map((file, index) => ({
        project_id: projectId,
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

      removePhysicalFile(getAbsoluteImagePath(imageRecord.path));

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
      status,
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

    // Filter by status
    if (status !== undefined && status !== "") {
      where.status = parseInt(status);
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
          countries: true,
          project_types: true,
          project_images: true,
          project_data: true,
          // Include primary investor relation (projects.investor_id)
          interested_investors: { select: { id: true, full_name: true, email: true, phone_number: true } },
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
    const { id } = req.params;
    const { status } = req.body;

    const updated = await prisma.projects.update({
      where: { id: parseInt(id) },
      data: { status: parseInt(status) },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
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
      status,
      solis_plant_id,
    } = req.body;

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
      ...(status !== undefined && { status: parseInt(status) }),
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
      },
    });

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
    const { offtaker_id } = req.body;

    let where = {
      is_deleted: 0,
    };

    if (offtaker_id) {
      where.offtaker_id = offtaker_id;
    }

    const projects = await prisma.projects.findMany({
      where,
      select: {
        id: true,
        project_name: true,
        offtaker_id: true,
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
        project_images: true,
        project_data: true,
        interested_investors: { select: { id: true, full_name: true, email: true, phone_number: true } },
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
