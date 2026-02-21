import express from "express";
import prisma from "../utils/prisma.js";
import { authenticateToken } from "../middleware/auth.js";
import { sendEmailUsingTemplate } from '../utils/email.js';

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
    const { title, slug, subject_en, subject_vi, content_en, content_vi, created_by } = req.body;

    if (!title || !slug || !subject_en) {
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
        subject_en,
        subject_vi,
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
    const { title, slug, subject_en, subject_vi, content_en, content_vi } = req.body;

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
        subject_en,
        subject_vi,
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

//This is to view template design in browser
router.get("/view/template/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const { language = 'en', send = 'false' } = req.query;

    // Sample template data for preview
    const verifyLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/123456789`;
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/offtaker/login`;

    const templateData = {
      user_name: "Maulik Patel",
      user_email: "mapatel90@gmail.com",
      account_type: 'Offtaker',
      verify_link: verifyLink,
      login_url: loginUrl,
      invoice_number: "INV-2026-001",
      amount: "$500",
      contract_title: "Solar Energy Agreement",
      project_name: "Solar Installation Project",
    };

    // If send=true is in query, actually send the email
    if (send === 'true') {
      const result = await sendEmailUsingTemplate({
        to: "mapatel90@gmail.com",
        templateSlug: slug,
        templateData,
        language: language
      });

      if (result.success) {
        return res.json({
          success: true,
          message: "Email sent successfully to mapatel90@gmail.com"
        });
      } else {
        return res.status(500).json({
          success: false,
          message: `Failed to send email: ${result.error}`
        });
      }
    }

    // Otherwise, just display the HTML in browser
    const { buildEmailLayout, getEmailTemplateData } = await import('../utils/email.js');

    // Get complete template data with settings
    const completeTemplateData = await getEmailTemplateData(templateData);

    // Fetch template from database
    const template = await prisma.email_template.findFirst({
      where: { slug }
    });

    if (!template) {
      return res.status(404).send(`
        <html>
          <body style="font-family: Arial; padding: 40px; text-align: center;">
            <h1>❌ Template Not Found</h1>
            <p>The template with slug "<strong>${slug}</strong>" does not exist in the database.</p>
            <p><a href="/api/email-templates">View all templates</a></p>
          </body>
        </html>
      `);
    }

    // Get content based on language
    const contentField = language === 'vi' ? 'content_vi' : 'content_en';
    const { replacePlaceholders } = await import('../utils/email.js');

    const rawContent = replacePlaceholders(
      template[contentField] || template.content_en,
      completeTemplateData
    );

    // Build the complete HTML
    const finalHtml = await buildEmailLayout({
      bodyContent: rawContent,
      templateData: completeTemplateData,
      language
    });

    // Send HTML to browser
    res.setHeader('Content-Type', 'text/html');
    res.send(finalHtml);

  } catch (e) {
    console.error('Error viewing template:', e);
    res.status(500).send(`
      <html>
        <body style="font-family: Arial; padding: 40px;">
          <h1>❌ Error</h1>
          <p>${e.message}</p>
          <pre>${e.stack}</pre>
        </body>
      </html>
    `);
  }
});

export default router;
