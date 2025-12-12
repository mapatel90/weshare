import express from "express";
import prisma from "../utils/prisma.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const {
      projectId,
      inverterId,
      search,
      downloadAll,
      limit,
      startDate,
      endDate,
    } = req.query;

    const parsedLimit = Number(limit);
    const limitNumber = !Number.isNaN(parsedLimit) && parsedLimit > 0 ? parsedLimit : null;
    // Default: fetch all records unless an explicit limit is provided
    const fetchAll = downloadAll === "1" || downloadAll === "true" || !limitNumber;

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

    // Date range filtering (inclusive). If only start is provided, first try that exact day.
    // If nothing is found for that day, we will fallback to >= startDate (see below).
    let dateFilter = undefined;
    const hasStart = typeof startDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(startDate);
    const hasEnd = typeof endDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(endDate);

    if (hasStart && hasEnd) {
      const gte = new Date(`${startDate}T00:00:00.000Z`);
      const lte = new Date(`${endDate}T23:59:59.999Z`);
      // swap if inverted
      dateFilter = gte > lte ? { gte: lte, lte: gte } : { gte, lte };
    } else if (hasStart && !hasEnd) {
      // primary attempt: only that calendar day
      dateFilter = {
        gte: new Date(`${startDate}T00:00:00.000Z`),
        lte: new Date(`${startDate}T23:59:59.999Z`),
      };
    } else if (!hasStart && hasEnd) {
      dateFilter = { lte: new Date(`${endDate}T23:59:59.999Z`) };
    }

    if (dateFilter) {
      where.date = dateFilter;
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

    // Get total count for pagination (with possible fallback if single-day has no rows)
    let primaryWhere = { ...where };
    let totalCount = await prisma.inverter_data.count({ where: primaryWhere });
    let effectiveWhere = primaryWhere;

    // Fallback: if user selected only startDate (single day) and no rows found,
    // broaden to >= startDate to show later dates.
    if (totalCount === 0 && hasStart && !hasEnd) {
      const fallbackDate = { gte: new Date(`${startDate}T00:00:00.000Z`) };
      effectiveWhere = { ...where, date: fallbackDate };
      totalCount = await prisma.inverter_data.count({ where: effectiveWhere });
    }

    // Fetch records: fetch all by default or cap to provided limit
    const inverterData = await prisma.inverter_data.findMany({
      where: effectiveWhere,
      orderBy: { date: "desc" },
      distinct: ["inverter_id", "date"],
      include: {
        project: true,
        inverter: true,
      },
      skip: 0,
      take: fetchAll ? undefined : limitNumber,
    });

    const effectiveLimit = limitNumber || totalCount;
    const returnedCount = fetchAll ? totalCount : Math.min(totalCount, effectiveLimit);
    const pageSize = 50; // frontend will show 50 per page

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
        limit: fetchAll ? totalCount : effectiveLimit,
        total: returnedCount,
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

router.post("/latest-record", async (req, res) => {
  try {
    const { projectId, projectInverterId } = req.body;
    // Build WHERE condition step-by-step
    let where = {
      project: { is_deleted: 0 }
    };

    // Filter by projectId if provided
    if (projectId) {
      where.projectId = Number(projectId);
    }

    // If inverter selected, return latest for that inverter
    if (projectInverterId) {
      where.inverter_id = Number(projectInverterId);
      const latest = await prisma.inverter_data.findFirst({
        where,
        orderBy: { date: "desc" },
      });
      return res.json({
        success: true,
        data: latest ? {
          inverter_id: latest.inverter_id,
          daily_yield: latest.daily_yield,
          total_yield: latest.total_yield,
          date: latest.date,
        } : null,
      });
    } else {
      // No inverter selected: get all inverters for project
      const inverters = await prisma.project_inverters.findMany({
        where: {
          is_deleted: 0,
          ...(projectId ? { project_id: Number(projectId) } : {}),
        },
      });
      // For each inverter, get latest record
      const results = await Promise.all(inverters.map(async (inv) => {
        const latest = await prisma.inverter_data.findFirst({
          where: {
            ...where,
            inverter_id: inv.inverter_id,
          },
          orderBy: { date: "desc" },
        });
        return latest ? {
          inverter_id: latest.inverter_id,
          daily_yield: latest.daily_yield,
          total_yield: latest.total_yield,
          date: latest.date,
        } : null;
      }));
      // Filter out nulls
      const filtered = results.filter(r => r !== null);
      return res.json({
        success: true,
        data: filtered,
      });
    }
  } catch (error) {
    console.error("Error fetching latest inverter data:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/chart-data", async (req, res) => {
  try {
    const { projectId, projectInverterId, date } = req.body;

    // Build WHERE condition step-by-step
    let where = {
      project: { is_deleted: 0 }
    };

    // Filter by projectId if provided
    if (projectId) {
      where.projectId = Number(projectId);
    }

    // Filter by inverter_id if provided
    if (projectInverterId) {
      where.inverter_id = Number(projectInverterId);
    }

    // Filter by date if provided (expecting YYYY-MM-DD)
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      where.date = {
        gte: new Date(`${date}T00:00:00.000Z`),
        lte: new Date(`${date}T23:59:59.999Z`)
      };
    }

    console.log("where", where);

    const allData = await prisma.inverter_data.findMany({
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

router.post("/monthly-chart", async (req, res) => {
  try {
    const { projectId, projectInverterId } = req.body;

    let where = {
      project: { is_deleted: 0 }
    };

    if (projectId) {
      where.projectId = Number(projectId);
    }

    // If projectInverterId is provided, filter by that inverter
    // If not provided (null/empty), show all inverters for the project
    if (projectInverterId) {
      where.inverter_id = Number(projectInverterId);
    }

    // Fetch all data matching the criteria with inverter and project_inverters relations
    const allData = await prisma.inverter_data.findMany({
      where: where,
      select: {
        date: true,
        generate_kw: true,
        inverter_id: true,
        inverter: {
          select: {
            inverterName: true,
          }
        },
        project: {
          select: {
            id: true,
            projectInverters: {
              where: {
                is_deleted: 0,
              },
              select: {
                inverter_id: true,
                inverter_serial_number: true,
              }
            }
          }
        }
      },
      orderBy: { date: "asc" },
    });

    // Group by month-year and collect inverter details
    const monthlyMap = new Map();

    allData.forEach((record) => {
      const date = new Date(record.date);
      const year = date.getFullYear();
      const month = date.getMonth(); // 0-11
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`; // YYYY-MM format

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          year,
          month,
          monthKey,
          totalGenerateKw: 0,
          inverters: new Map(), // Map to store inverter_id -> {name, serial, totalKw}
        });
      }

      const monthData = monthlyMap.get(monthKey);
      monthData.totalGenerateKw += Number(record.generate_kw) || 0;

      // Group by inverter
      if (record.inverter_id) {
        const invId = record.inverter_id;
        if (!monthData.inverters.has(invId)) {
          // Find serial number from project_inverters
          const projectInverter = record.project?.projectInverters?.find(
            pi => pi.inverter_id === invId
          );

          monthData.inverters.set(invId, {
            inverterId: invId,
            inverterName: record.inverter?.inverterName || `Inverter ${invId}`,
            serialNumber: projectInverter?.inverter_serial_number || null,
            totalKw: 0,
          });
        }

        const invData = monthData.inverters.get(invId);
        invData.totalKw += Number(record.generate_kw) || 0;
      }
    });

    // Convert map to array and sort by year-month
    const monthlyChartData = Array.from(monthlyMap.values())
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      })
      .map(item => ({
        year: item.year,
        month: item.month,
        monthKey: item.monthKey,
        totalGenerateKw: item.totalGenerateKw,
        inverters: Array.from(item.inverters.values()).map(inv => ({
          inverterId: inv.inverterId,
          inverterName: inv.inverterName,
          serialNumber: inv.serialNumber,
          totalKw: inv.totalKw,
        })),
      }));

    return res.json({ success: true, data: monthlyChartData });

  } catch (error) {
    console.error("Error fetching monthly chart data:", error);
    return res.status(500).json({ error: "Server error", message: error.message });
  }
});

// Offtaker Summary Card count fetch Api
router.post("/offtaker/summary/data", async (req, res) => {
  try {
    let { projectId, projectInverterId, userId } = req.body;

    // 1️⃣ If userId is given → map user to projectId
    if (userId) {
      const userProjects = await prisma.project.findMany({
        where: {
          is_deleted: 0,
          offtaker_id: Number(userId)
        },
        select: { id: true }
      });

      const userProjectIds = userProjects.map(p => p.id);

      // If API does not receive projectId → use user's projects
      if (!projectId) {
        projectId = userProjectIds;
      }
    }

    // 2️⃣ Build WHERE for normal flow
    let where = {
      project: { is_deleted: 0 }
    };

    if (projectId) {
      // projectId can be array (from user) or single
      where.projectId = Array.isArray(projectId)
        ? { in: projectId.map(Number) }
        : Number(projectId);
    }

    if (projectInverterId) {
      where.inverter_id = Number(projectInverterId);
    }

    // 3️⃣ If inverter selected → return latest inverter data (same as your old logic)
    if (projectInverterId) {
      const latest = await prisma.inverter_data.findFirst({
        where,
        orderBy: { date: "desc" },
      });

      return res.json({
        success: true,
        data: latest
          ? {
              inverter_id: latest.inverter_id,
              daily_yield: latest.daily_yield,
              total_yield: latest.total_yield,
              date: latest.date,
            }
          : null,
      });
    }

    // 4️⃣ No inverter selected → get all inverters for project(s)
    const inverters = await prisma.project_inverters.findMany({
      where: {
        is_deleted: 0,
        ...(projectId
          ? {
              project_id: Array.isArray(projectId)
                ? { in: projectId.map(Number) }
                : Number(projectId),
            }
          : {}),
      },
    });

    // 5️⃣ For each inverter find latest record
    const results = await Promise.all(
      inverters.map(async (inv) => {
        const latest = await prisma.inverter_data.findFirst({
          where: {
            ...where,
            inverter_id: inv.inverter_id,
          },
          orderBy: { date: "desc" },
        });

        return latest
          ? {
              inverter_id: latest.inverter_id,
              daily_yield: latest.daily_yield,
              total_yield: latest.total_yield,
              date: latest.date,
            }
          : null;
      })
    );

    // 6️⃣ Remove nulls
    const filtered = results.filter((r) => r !== null);

    return res.json({
      success: true,
      data: filtered,
    });
  } catch (error) {
    console.error("Error fetching latest inverter data:", error);
    return res.status(500).json({ error: "Server error" });
  }
});


export default router;
