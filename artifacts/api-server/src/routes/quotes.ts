import { Router } from "express";
import { db } from "@workspace/db";
import { quoteRequestsTable, quoteItemsTable, plantsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { authenticateToken, requireAdmin, type AuthRequest } from "../lib/auth.js";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { customerName, customerPhone, items } = req.body;
    if (!customerName || !customerPhone || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "Bad Request", message: "customerName, customerPhone, and items are required" });
      return;
    }

    let totalAmount = 0;
    const enrichedItems: Array<{
      plantId: number;
      plantNameAr: string;
      plantNameEn: string;
      descriptionAr: string | null;
      descriptionEn: string | null;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }> = [];

    for (const item of items) {
      const plants = await db.select().from(plantsTable).where(eq(plantsTable.id, item.plantId)).limit(1);
      const plant = plants[0];
      if (!plant) {
        res.status(404).json({ error: "Not Found", message: `Plant ${item.plantId} not found` });
        return;
      }
      const qty = Math.max(1, parseInt(item.quantity) || 1);
      const unitPrice = plant.price;
      const totalPrice = unitPrice * qty;
      totalAmount += totalPrice;
      enrichedItems.push({
        plantId: plant.id,
        plantNameAr: plant.nameAr,
        plantNameEn: plant.nameEn,
        descriptionAr: plant.descriptionAr || null,
        descriptionEn: plant.descriptionEn || null,
        quantity: qty,
        unitPrice,
        totalPrice,
      });
    }

    const [quote] = await db.insert(quoteRequestsTable).values({
      customerName,
      customerPhone,
      totalAmount,
      status: "pending",
    }).returning();

    for (const item of enrichedItems) {
      await db.insert(quoteItemsTable).values({ quoteId: quote.id, ...item });
    }

    const quoteItems = await db.select().from(quoteItemsTable).where(eq(quoteItemsTable.quoteId, quote.id));
    res.status(201).json({ ...quote, items: quoteItems });
  } catch (err) {
    console.error("Create quote error:", err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to create quote" });
  }
});

router.get("/", authenticateToken, requireAdmin, async (_req: AuthRequest, res) => {
  try {
    const quotes = await db.select().from(quoteRequestsTable).orderBy(desc(quoteRequestsTable.createdAt));
    const enriched = await Promise.all(quotes.map(async (q) => {
      const items = await db.select().from(quoteItemsTable).where(eq(quoteItemsTable.quoteId, q.id));
      return { ...q, items };
    }));
    res.json(enriched);
  } catch (err) {
    console.error("Get quotes error:", err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get quotes" });
  }
});

router.get("/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const quotes = await db.select().from(quoteRequestsTable).where(eq(quoteRequestsTable.id, id)).limit(1);
    if (!quotes[0]) {
      res.status(404).json({ error: "Not Found", message: "Quote not found" });
      return;
    }
    const items = await db.select().from(quoteItemsTable).where(eq(quoteItemsTable.quoteId, id));
    res.json({ ...quotes[0], items });
  } catch (err) {
    console.error("Get quote error:", err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get quote" });
  }
});

router.patch("/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, adminNotes, items } = req.body;

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (status) updates.status = status;
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;

    if (items && Array.isArray(items)) {
      await db.delete(quoteItemsTable).where(eq(quoteItemsTable.quoteId, id));
      let totalAmount = 0;
      for (const item of items) {
        const qty = Math.max(1, parseInt(item.quantity) || 1);
        const unitPrice = parseFloat(item.unitPrice) || 0;
        const totalPrice = unitPrice * qty;
        totalAmount += totalPrice;
        await db.insert(quoteItemsTable).values({
          quoteId: id,
          plantId: item.plantId,
          plantNameAr: item.plantNameAr,
          plantNameEn: item.plantNameEn,
          descriptionAr: item.descriptionAr || null,
          descriptionEn: item.descriptionEn || null,
          quantity: qty,
          unitPrice,
          totalPrice,
        });
      }
      updates.totalAmount = totalAmount;
    }

    const [quote] = await db.update(quoteRequestsTable).set(updates as any).where(eq(quoteRequestsTable.id, id)).returning();
    if (!quote) {
      res.status(404).json({ error: "Not Found", message: "Quote not found" });
      return;
    }
    const updatedItems = await db.select().from(quoteItemsTable).where(eq(quoteItemsTable.quoteId, id));
    res.json({ ...quote, items: updatedItems });
  } catch (err) {
    console.error("Update quote error:", err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to update quote" });
  }
});

router.delete("/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(quoteRequestsTable).where(eq(quoteRequestsTable.id, id));
    res.status(204).send();
  } catch (err) {
    console.error("Delete quote error:", err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to delete quote" });
  }
});

export default router;
