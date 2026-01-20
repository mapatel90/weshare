import express from "express";
import prisma from "../utils/prisma.js";
import { authenticateToken } from "../middleware/auth.js";
import { sendInvoiceEmail } from "../utils/email.js";
import { createNotification } from "../utils/notifications.js";

const router = express.Router();

// router.get("/", authenticateToken, async (req, res) => {
//   try {
//     const {
//       page = 1,
//       limit = 10,
//       search,
//       status,
//       id,
//       project_id,
//       offtaker_id,
//     } = req.query;
//     const offset = (page - 1) * limit;

//     // Build WHERE condition
//     const where = {
//       is_deleted: 0,
//     };

//     // Optional filters
//     if (status !== undefined) {
//       where.status = { equals: status };
//     }

//     if (id !== undefined) {
//       where.id = parseInt(id);
//     }

//     if (project_id !== undefined) {
//       where.project_id = parseInt(project_id);
//     }

//     if (offtaker_id !== undefined) {
//       where.offtaker_id = parseInt(offtaker_id);
//     }

//     // Search by project name, offtaker full_name, and numeric amounts
//     if (search) {
//       const numeric = parseFloat(search);
//       console.log("Searching invoices with term:", numeric);
//       const orClauses = [
//         {
//           projects: {
//             project_name: { contains: search, mode: "insensitive" },
//           },
//         },
//         {
//           users: {
//             full_name: { contains: search, mode: "insensitive" },
//           },
//         },
//       ];

//       if (Number.isFinite(numeric)) {
//         orClauses.push({ sub_amount: { equals: numeric } });
//         orClauses.push({ tax_amount: { equals: numeric } });
//         orClauses.push({ total_amount: { equals: numeric } });
//       }

//       where.OR = orClauses;
//     }

//     // Fetch data with relations
//     const [invoices, total] = await Promise.all([
//       prisma.invoices.findMany({
//         where,
//         skip: parseInt(offset),
//         take: parseInt(limit),
//         orderBy: { id: "asc" },
//         include: {
//           projects: {
//             select: {
//               id: true,
//               project_name: true,
//             },
//           },
//           users: {
//             select: {
//               id: true,
//               full_name: true,
//               email: true,
//             },
//           },
//         },
//       }),
//       prisma.invoices.count({ where }),
//     ]);

//     // Send success response
//     res.json({
//       success: true,
//       data: {
//         invoices,
//         pagination: {
//           page: parseInt(page),
//           limit: parseInt(limit),
//           total,
//           pages: Math.ceil(total / limit),
//         },
//       },
//     });
//   } catch (error) {
//     console.error("Get invoices error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// });

router.get("/", authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      project_id,
      offtaker_id,
    } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const offset = (pageNumber - 1) * limitNumber;

    // BASE WHERE
    const where = {
      is_deleted: 0,
    };

    // Ensure status filter is numeric (e.g., "0"/"1")
    if (status !== undefined) {
      const parsedStatus = Number(status);
      if (!Number.isNaN(parsedStatus)) {
        where.status = parsedStatus;
      }
    }

    if (project_id) {
      where.project_id = Number(project_id);
    }

    if (offtaker_id) {
      where.offtaker_id = Number(offtaker_id);
    }

    // 🔍 SEARCH LOGIC (SIMPLE)
    if (search && search.trim() !== "") {
      const searchText = search.trim();
      const searchNumber = Number(searchText);
      console.log("Searching invoices with term:", searchText);
      console.log("Parsed search number:", searchNumber);

      where.OR = [
        // project_name search (via project_id)
        {
          projects: {
            is: {
              project_name: {
                contains: searchText,
                mode: "insensitive",
              },
            },
          },
        },

        // offtaker full_name search (via offtaker_id)
        {
          users: {
            is: {
              full_name: {
                contains: searchText,
                mode: "insensitive",
              },
            },
          },
        },
      ];

      // numeric search
      if (!Number.isNaN(searchNumber)) {
        where.OR.push(
          { sub_amount: searchNumber },
          { tax_amount: searchNumber },
          { total_amount: searchNumber }
        );
      }
    }

    // FETCH DATA
    const [invoices, total] = await Promise.all([
      prisma.invoices.findMany({
        where,
        skip: offset,
        take: limitNumber,
        orderBy: { id: "desc" },
        include: {
          projects: {
            select: {
              id: true,
              project_name: true,
            },
          },
          users: {
            select: {
              id: true,
              full_name: true,
            },
          },
        },
      }),
      prisma.invoices.count({ where }),
    ]);

    res.json({
      success: true,
      data: invoices,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        pages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    console.error("Invoice search error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});


// Get single invoice by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoices.findUnique({
      where: { id: parseInt(id) },
      include: {
        projects: {
          select: {
            id: true,
            project_name: true,
          },
        },
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
            address_1: true,
            address_2: true,
            country_id: true,
            state_id: true,
            city_id: true,
            zipcode: true,
            countries: {
              select: {
                id: true,
                name: true,
              },
            },
            states: {
              select: {
                id: true,
                name: true,
              },
            },
            cities: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        invoice_items: {
          select: {
            id: true,
            item: true,
            description: true,
            unit: true,
            price: true,
            item_total: true,
          },
          orderBy: { id: "asc" },
        },
        payments: {
          where: { is_deleted: 0 },
          orderBy: { id: "desc" },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    return res.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      project_id,
      offtaker_id,
      amount,
      total_unit,
      invoice_number,
      invoice_prefix,
      invoice_date,
      due_date,
      tax,
      tax_amount,
      billing_adress_1,
      billing_adress_2,
      billing_city_id,
      billing_state_id,
      billing_country_id,
      billing_zipcode,
      items = [],
      note,
      terms_and_conditions,
      created_by,
      status
    } = req.body;

    if (!project_id || !offtaker_id || status === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const incrementInvoiceNumber = (invNo) => {
      const length = invNo.length; // "001" → 3
      const next = parseInt(invNo, 10) + 1; // 1 → 2
      return next.toString().padStart(length, "0");
    };

    const parsedItems = Array.isArray(items)
      ? items
          .map((it) => ({
            item: it?.item || "",
            description: it?.description || "",
            unit: Number(it?.unit) || 0,
            price: Number(it?.price) || 0,
          }))
          .filter((it) => it.item)
      : [];

    const itemsTotal = parsedItems.reduce(
      (sum, it) => sum + it.unit * it.price,
      0
    );

    const invoiceAmount = amount !== undefined ? parseFloat(amount) : itemsTotal;
    const invoiceTotal = total_unit !== undefined
      ? parseFloat(total_unit)
      : itemsTotal;

    const created = await prisma.$transaction(async (tx) => {
      const newInvoice = await tx.invoices.create({
        data: {
          project_id: parseInt(project_id),
          offtaker_id: parseInt(offtaker_id),
          sub_amount: Number.isFinite(invoiceAmount) ? invoiceAmount : 0,
          total_amount: Number.isFinite(invoiceTotal) ? invoiceTotal : 0,
          status: 0, // Default to draft
          invoice_number: invoice_number || "",
          invoice_prefix: invoice_prefix || "",
          invoice_date: invoice_date ? new Date(invoice_date) : null,
          due_date: due_date ? new Date(due_date) : null,
          currency: "VND",
          tax_id: tax ? parseFloat(tax) : null,
          tax_amount: Number.isFinite(parseFloat(tax_amount))
            ? parseFloat(tax_amount)
            : 0,
          billing_adress_1: billing_adress_1 || "",
          billing_adress_2: billing_adress_2 || "",
          billing_city_id: billing_city_id ? parseInt(billing_city_id) : null,
          billing_state_id: billing_state_id ? parseInt(billing_state_id) : null,
          billing_country_id: billing_country_id
            ? parseInt(billing_country_id)
            : null,
          billing_zipcode: billing_zipcode ? parseInt(billing_zipcode) : null,
          notes: note || "",
          terms_and_conditions: terms_and_conditions || "",
          created_by: created_by ? parseInt(created_by) : null,
        },
      });

      if (parsedItems.length) {
        await tx.invoice_items.createMany({
          data: parsedItems.map((it) => ({
            invoice_id: newInvoice.id,
            item: it.item,
            description: it.description,
            unit: it.unit,
            price: it.price,
            item_total: it.unit * it.price,
          })),
        });
      }

      return newInvoice;
    });

    const nextInvoiceNumber = incrementInvoiceNumber(created.invoice_number);

    const setting = await prisma.settings.findFirst({
      where: { key: "next_invoice_number" },
    });

    if (setting) {
      await prisma.settings.update({
        where: { id: setting.id },
        data: { value: nextInvoiceNumber },
      });
    }

    return res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      data: created,
    });
  } catch (error) {
    console.error("Error creating invoice:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update invoice
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      project_id,
      offtaker_id,
      amount,
      total_unit,
      status,
      invoice_number,
      invoice_prefix,
      invoice_date,
      due_date,
      currency,
      tax,
      tax_amount,
      billing_adress_1,
      billing_adress_2,
      billing_city_id,
      billing_state_id,
      billing_country_id,
      billing_zipcode,
      items = [],
      note,
      terms_and_conditions,
    } = req.body;

    if (!project_id || !offtaker_id || status === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const parsedItems = Array.isArray(items)
      ? items
          .map((it) => ({
            item: it?.item || "",
            description: it?.description || "",
            unit: Number(it?.unit) || 0,
            price: Number(it?.price) || 0,
            id: it?.id,
          }))
          .filter((it) => it.item)
      : [];

    const itemsTotal = parsedItems.reduce(
      (sum, it) => sum + it.unit * it.price,
      0
    );

    const invoiceAmount = amount !== undefined ? parseFloat(amount) : itemsTotal;
    const invoiceTotal = total_unit !== undefined
      ? parseFloat(total_unit)
      : itemsTotal;

    const updated = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoices.update({
        where: { id: parseInt(id) },
        data: {
          project_id: parseInt(project_id),
          offtaker_id: parseInt(offtaker_id),
          sub_amount: Number.isFinite(invoiceAmount) ? invoiceAmount : 0,
          total_amount: Number.isFinite(invoiceTotal) ? invoiceTotal : 0,
          status: parseInt(status),
          invoice_number: invoice_number || "",
          invoice_prefix: invoice_prefix || "",
          invoice_date: invoice_date ? new Date(invoice_date) : null,
          due_date: due_date ? new Date(due_date) : null,
          currency: currency || "VND",
          tax_id: tax ? parseFloat(tax) : null,
          tax_amount: Number.isFinite(parseFloat(tax_amount))
            ? parseFloat(tax_amount)
            : 0,
          billing_adress_1: billing_adress_1 || "",
          billing_adress_2: billing_adress_2 || "",
          billing_city_id: billing_city_id ? parseInt(billing_city_id) : null,
          billing_state_id: billing_state_id ? parseInt(billing_state_id) : null,
          billing_country_id: billing_country_id
            ? parseInt(billing_country_id)
            : null,
          billing_zipcode: billing_zipcode ? parseInt(billing_zipcode) : null,
          notes: note || "",
          terms_and_conditions: terms_and_conditions || "",
        },
      });

      // Replace all items for this invoice
      await tx.invoice_items.deleteMany({ where: { invoice_id: inv.id } });

      if (parsedItems.length) {
        await tx.invoice_items.createMany({
          data: parsedItems.map((it) => ({
            invoice_id: inv.id,
            item: it.item,
            description: it.description,
            unit: it.unit,
            price: it.price,
            item_total: it.unit * it.price,
          })),
        });
      }

      return inv;
    });

    return res.status(200).json({
      success: true,
      message: "Invoice updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating invoice:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// Soft delete invoice
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.invoices.update({
      where: { id: parseInt(id) },
      data: { is_deleted: 1 },
    });
    return res
      .status(200)
      .json({ success: true, message: "Invoice deleted successfully" });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
