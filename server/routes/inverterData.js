import express from "express";
import prisma from "../utils/prisma.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // Include related Project and Inverter records
    const inverterData = await prisma.inverter_data.findMany({
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

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: "projectId is required",
      });
    }

    const pid = Number(projectId);

    // -------------------------
    //  IF SELECTED INVERTER GIVEN → ONLY THAT INVERTER LATEST
    // -------------------------
    if (projectInverterId) {
      const latestRecord = await prisma.inverter_data.findFirst({
        where: {
          projectId: pid,
          inverter_id: Number(projectInverterId),
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
    } else {
      // -------------------------
      //  ELSE → GET LATEST RECORD FOR ALL INVERTERS
      // -------------------------

      const projectInverters = await prisma.project_inverters.findMany({
        where: { project_id: pid, is_deleted: 0 },
      });

      if (projectInverters.length === 0) {
        return res.status(200).json({
          success: true,
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
