import express from "express";
import prisma from "../utils/prisma.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// List all templates
router.get("/", authenticateToken, async (req, res) => {
  try {
    const templates = await prisma.email_template.findMany({
      orderBy: { created_at: "desc" },
    });
    res.json({ success: true, data: templates });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get template by id
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const template = await prisma.email_template.findUnique({ where: { id } });
    if (!template) {
      return res.status(404).json({ success: false, message: "Template not found" });
    }
    res.json({ success: true, data: template });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Add template
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { title, slug, subject, content_en, content_vi, created_by } = req.body;

    if (!title || !slug || !subject) {
      return res.status(400).json({ success: false, message: "Required fields missing" });
    }

    const exists = await prisma.email_template.findFirst({ where: { slug } });
    if (exists) {
      return res.status(400).json({ success: false, message: "Slug already exists" });
    }

    const created = await prisma.email_template.create({
      data: {
        title,
        slug,
        subject,
        content_en: content_en || null,
        content_vi: content_vi || null,
        created_by: created_by ? parseInt(created_by) : null,
      },
    });

    res.status(201).json({ success: true, data: created });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Edit template
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, slug, subject, content_en, content_vi } = req.body;

    const existing = await prisma.email_template.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Template not found" });
    }

    if (slug && slug !== existing.slug) {
      const slugExists = await prisma.email_template.findFirst({
        where: {
          slug,
          id: { not: id },
        },
      });
      if (slugExists) {
        return res.status(400).json({ success: false, message: "Slug already exists" });
      }
    }

    const updated = await prisma.email_template.update({
      where: { id },
      data: {
        title,
        slug,
        subject,
        content_en,
        content_vi,
      },
    });

    res.json({ success: true, data: updated });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Delete template
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    const existing = await prisma.email_template.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Template not found" });
    }

    await prisma.email_template.delete({ where: { id } });

    res.json({ success: true, message: "Template deleted successfully" });
  } catch (e) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
