import express from "express";
import prisma from "../utils/prisma.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const MAX_LIMIT = 50;

    // Only return latest MAX_LIMIT records (overall). Ignore page from client.
    const where = {
      project: { is_deleted: 0 },
    };

    // removed invalid distinct count (Prisma count() doesn't accept `distinct`)
    // const totalCounts = await prisma.inverter_data.count({
    //   distinct: ["inverter_id", "date"], // unique rows
    // });

    // total count of active records
    const totalCount = await prisma.inverter_data.count({ where });

    // fetch latest up to MAX_LIMIT
    const inverterData = await prisma.inverter_data.findMany({
      where,
      orderBy: { date: "desc" },
      distinct: ["inverter_id", "date"], // prevents duplicate records
      include: {
        project: true,
        inverter: true,
      },
      skip: 0,
      take: MAX_LIMIT,
    });

    const returnedCount = Math.min(totalCount, MAX_LIMIT);
    const pageSize = 10; // frontend will show 10 per page

    res.status(200).json({
      success: true,
      data: inverterData,
      pagination: {
        page: 1,
        limit: MAX_LIMIT,
        total: returnedCount, // show total as max 50
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
