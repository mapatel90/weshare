import express from "express";
import prisma from "../utils/prisma.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const MAX_LIMIT = 50;
    const { projectId, inverterId, search, downloadAll } = req.query;

    const fetchAll = downloadAll === "1" || downloadAll === "true";

    // Build the base where clause based on filters
    let where = {
      project: { is_deleted: 0 },
    };

    if (projectId) {
      where.projectId = Number(projectId);
    }

    if (inverterId) {
      where.inverter_id = Number(inverterId);
    }

    // If a search term is provided, search across relevant columns in the whole table
    const trimmedSearch = typeof search === "string" ? search.trim() : "";
    if (trimmedSearch) {
      const numericSearch = Number(trimmedSearch);
      const isNumeric = !Number.isNaN(numericSearch);

      // Detect YYYY-MM-DD date and build a day range (UTC) to avoid tz offsets
      const isISODate = /^\d{4}-\d{2}-\d{2}$/.test(trimmedSearch);
      const dateRange = isISODate
        ? {
            gte: new Date(`${trimmedSearch}T00:00:00.000Z`),
            lte: new Date(`${trimmedSearch}T23:59:59.999Z`),
          }
        : null;

      const orFilters = [
        { project: { project_name: { contains: trimmedSearch, mode: "insensitive" } } },
        { inverter: { inverterName: { contains: trimmedSearch, mode: "insensitive" } } },
        { time: { contains: trimmedSearch, mode: "insensitive" } },
      ];

      if (dateRange) {
        orFilters.push({ date: dateRange });
      }

      if (isNumeric) {
        orFilters.push(
          { generate_kw: numericSearch },
          { ac_frequency: numericSearch },
          { daily_yield: numericSearch },
          { annual_yield: numericSearch },
          { total_yield: numericSearch }
        );
      }

      if (orFilters.length) {
        where.AND = [...(where.AND || []), { OR: orFilters }];
      }
    }

    // Get total count for pagination
    const totalCount = await prisma.inverter_data.count({ where });

    // Fetch records: capped to 50 unless downloadAll is set
    const inverterData = await prisma.inverter_data.findMany({
      where,
      orderBy: { date: "desc" },
      distinct: ["inverter_id", "date"],
      include: {
        project: true,
        inverter: true,
      },
      skip: 0,
      take: fetchAll ? undefined : MAX_LIMIT,
    });

    const returnedCount = fetchAll ? totalCount : Math.min(totalCount, MAX_LIMIT);
    const pageSize = 10; // frontend will show 10 per page

    // --- Fetch full project list (for dropdown) ---
    const projectList = await prisma.project.findMany({
      where: { is_deleted: 0 },
      orderBy: { project_name: "asc" }
    });

    const inverterRawList = await prisma.project_inverters.findMany({
      where: {
        is_deleted: 0,
        ...(projectId ? { project_id: Number(projectId) } : {}),
      },
      include: { inverter: true },
      orderBy: { inverter_id: "asc" },
    });

     // Map inverter list to simple {id, name} shape
    const inverterList = inverterRawList.map(i => ({
      id: i.inverter_id,
      name: (i.inverter && (i.inverter.inverterName || i.inverter.name)) || `Inverter ${i.inverter_id}`,
      projectId: i.project_id
    }));

    res.status(200).json({
      success: true,
      data: inverterData,
       projectList,
      inverterList, 
      pagination: {
        page: 1,
        limit: fetchAll ? totalCount : MAX_LIMIT,
        total: returnedCount, // show total as max 50 unless downloadAll
        pages: Math.max(1, Math.ceil(returnedCount / pageSize)),
      },
    });
  } catch (error) {
    console.error("Error fetching inverter data:", error.message, error.stack);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

router.get("/project-invert-chart", async (req, res) => {
  try {
    // Include related Project and Inverter records (only projects with is_deleted = 0)
    const inverterData = await prisma.inverter_data.findMany({
      where: {
        project: { is_deleted: 0 },
      },
      orderBy: { date: "desc" },
      include: {
        project: true,
        inverter: true,
      },
    });
    res.status(200).json({ success: true, data: inverterData });
  } catch (error) {
    console.error("Error fetching inverter data:", error.message, error.stack);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

router.get("/latest", async (req, res) => {
  try {
    const { projectId, projectInverterId } = req.query;

    // -------------------------
    //  CASE 1: NO projectId PROVIDED → LATEST FOR ALL PROJECTS / INVERTERS
    // -------------------------
    if (!projectId) {
      // Find all active project_inverters
      const projectInverters = await prisma.project_inverters.findMany({
        where: { is_deleted: 0 },
      });

      if (projectInverters.length === 0) {
        return res.status(200).json({
          success: true,
          single: false,
          count: 0,
          data: [],
          message: "No inverters found",
        });
      }

      // For each project_inverters record, fetch latest inverter_data (only if related project is not deleted)
      const latestRecords = await Promise.all(
        projectInverters.map(async (pi) => {
          return await prisma.inverter_data.findFirst({
            where: {
              projectId: pi.project_id,
              inverter_id: pi.inverter_id,
            },
            orderBy: { date: "desc" },
            include: {
              project: true,
              inverter: true,
            },
          });
        })
      );

      const filtered = latestRecords.filter((rec) => rec !== null);

      return res.status(200).json({
        success: true,
        single: false,
        count: filtered.length,
        data: filtered,
      });
    }

    const pid = Number(projectId);

    // -------------------------
    //  CASE 2: projectId + projectInverterId → ONLY THAT INVERTER LATEST
    // -------------------------
    if (projectInverterId) {
      const latestRecord = await prisma.inverter_data.findFirst({
        where: {
          projectId: pid,
          inverter_id: Number(projectInverterId),
          project: { is_deleted: 0 },
        },
        orderBy: { date: "desc" },
        include: {
          project: true,
          inverter: true,
        },
      });

      return res.status(200).json({
        success: true,
        single: true,
        data: latestRecord || null,
      });
    }

    // -------------------------
    //  CASE 3: ONLY projectId → LATEST RECORD FOR ALL INVERTERS OF THAT PROJECT
    // -------------------------

    const projectInverters = await prisma.project_inverters.findMany({
      where: { project_id: pid, is_deleted: 0 },
    });

    if (projectInverters.length === 0) {
      return res.status(200).json({
        success: true,
        single: false,
        count: 0,
        data: [],
        message: "No inverters found for this project",
      });
    }

    const inverterIds = projectInverters.map((inv) => inv.inverter_id);

    const latestRecords = await Promise.all(
      inverterIds.map(async (invId) => {
        return await prisma.inverter_data.findFirst({
          where: {
            projectId: pid,
            inverter_id: invId,
            project: { is_deleted: 0 },
          },
          orderBy: { date: "desc" },
          include: {
            project: true,
            inverter: true,
          },
        });
      })
    );

    const filtered = latestRecords.filter((rec) => rec !== null);

    return res.status(200).json({
      success: true,
      single: false,
      count: filtered.length,
      data: filtered,
    });
  } catch (error) {
    console.error("Error fetching latest inverter data:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

export default router;
