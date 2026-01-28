import express from "express";
import prisma from "../utils/prisma.js";
import { authenticateToken } from "../middleware/auth.js";
import { createNotification } from "../utils/notifications.js";
import { getUserLanguage, t } from "../utils/i18n.js";
import { getUserFullName } from "../utils/common.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { projectId, userId, fullName, email, phoneNumber, notes, created_by } = req.body;
    if (!fullName || !email) {
      return res
        .status(400)
        .json({ success: false, message: "fullName and email are required" });
    }

    const created = await prisma.interested_investors.create({
      data: {
        project_id: projectId ?? null,
        user_id: userId ?? null,
        full_name: fullName,
        email,
        phone_number: phoneNumber ?? null,
        notes: notes ?? null,
        created_by: created_by ?? null,
      },
    });

    //THis is to create notification for the offtaker when an investor shows interest
    if (projectId) {
      const project = await prisma.projects.findFirst({
        where: { id: Number(projectId) },
        include: { offtaker: true },
      });

      if (project && project.offtaker) {
        const notificationMessage = `New investor interest with name ${fullName} for project "${project.project_name}".`;
        await createNotification({
          userId: project.offtaker.id,
          title: notificationMessage,
          message: notificationMessage,
          moduleType: 'projects',
          moduleId: project.id,
          actionUrl: `/projects/${project.id}/investors`,
        });
      }
    }

    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// List with optional filters + pagination
router.get("/", async (req, res) => {
  try {
    const { projectId, userId, page = 1, limit = 25 } = req.query;
    const where = { is_deleted: 0 };

    if (projectId) where.project_id = Number(projectId);
    if (userId) where.user_id = Number(userId);

    const take = Number(limit);
    const skip = (Number(page) - 1) * take;

    const [data, total] = await Promise.all([
      prisma.interested_investors.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip,
        take,
        include: {
          projects: {
            include: {
              offtaker: {
                select: { full_name: true, email: true },
              },
              project_images: true,
              project_data: true,
            },
          },
          users: true,
        },
      }),
      prisma.interested_investors.count({ where }),
    ]);

    return res.json({ success: true, data, total, page: Number(page), limit: take });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Get single by id
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const record = await prisma.interestedInvestor.findFirst({
      where: { id, is_deleted: 0 },
      include: {
        project: {
          include: { project_images: true },
        },
        user: true,
      },
    });
    if (!record) return res.status(404).json({ success: false, message: "Not found" });
    return res.json({ success: true, data: record });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Update
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { projectId, fullName, email, phoneNumber, notes, status } = req.body;

    const updated = await prisma.interested_investors.update({
      where: { id },
      data: {
        project_id: Number(projectId) ?? undefined,
        full_name: fullName ?? undefined,
        email: email ?? undefined,
        phone_number: phoneNumber ?? undefined,
        notes: notes ?? undefined,
        status: status ?? undefined,
      },
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
});


router.delete("/:investorUserId/:projectId", authenticateToken, async (req, res) => {
  try {
    const investor_user_id = Number(req.params.investorUserId);
    const projectId = Number(req.params.projectId);

    // Get project current assigned investor
    const project = await prisma.projects.findUnique({
      where: { id: projectId },
      select: { investor_id: true },
    });

    // Only remove from project IF this investor is the marked one
    if (project?.investor_id === investor_user_id) {
      await prisma.projects.update({
        where: { id: projectId },
        data: { investor_id: null },
      });
    }

    // Find interested investor record
    const investorRecord = await prisma.interested_investors.findFirst({
      where: { user_id: investor_user_id, project_id: projectId },
    });

    if (!investorRecord) {
      return res.status(400).json({ success: false, message: "Investor not found" });
    }

    // HARD DELETE only that record
    await prisma.interested_investors.delete({
      where: { id: investorRecord.id },
    });

    return res.json({ success: true, message: "Investor deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
});



// Mark investor for project - updates project.investor_id
router.post("/:id/mark-investor", authenticateToken, async (req, res) => {
  try {
    const investorId = Number(req.params.id);
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({ success: false, message: "projectId is required" });
    }

    // Verify investor exists and is not deleted
    const investor = await prisma.interested_investors.findFirst({
      where: { id: investorId, is_deleted: 0 },
    });
    if (!investor) {
      return res.status(404).json({ success: false, message: "Investor not found" });
    }

    // Verify project exists
    const project = await prisma.projects.findFirst({
      where: { id: Number(projectId), is_deleted: 0 },
    });
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    // Update project with investor_id
    const updated = await prisma.projects.update({
      where: { id: Number(projectId) },
      data: { investor_id: investor?.user_id },
    });

    // Create notification
    const lang = await getUserLanguage(investor?.user_id);
    const assigned_by = await getUserFullName(1);

    const notification_title = t(lang, 'notification_msg.investor_marked_title', {
      project_name: updated.project_name,
    });

    const notification_message = t(lang, 'notification_msg.investor_marked_message', {
      project_name: updated.project_name,
      assigned_by: assigned_by,
    });

    if (updated && investor?.user_id) {
      await createNotification({
        userId: investor?.user_id,
        title: notification_title,
        message: notification_message,
        moduleType: 'projects',
        moduleId: projectId,
        actionUrl: `/projects/${updated.id}/investors`,
        created_by: 1,
      });
    }

    return res.json({ success: true, data: updated, message: "Investor marked successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
});
export default router;
