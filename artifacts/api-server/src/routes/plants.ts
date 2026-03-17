import { Router } from "express";
import { db } from "@workspace/db";
import { plantsTable, categoriesTable } from "@workspace/db/schema";
import { eq, and, gte, lte, gt, like, or } from "drizzle-orm";
import { authenticateToken, requireAdmin, type AuthRequest } from "../lib/auth.js";

const router = Router();

async function enrichPlant(plant: typeof plantsTable.$inferSelect) {
  let category = null;
  if (plant.categoryId) {
    const cats = await db.select().from(categoriesTable).where(eq(categoriesTable.id, plant.categoryId)).limit(1);
    category = cats[0] || null;
  }
  return { ...plant, category };
}

router.get("/", async (req, res) => {
  try {
    const { search, categoryId, minPrice, maxPrice, minHeight, maxHeight, available } = req.query;

    const conditions = [];

    if (categoryId) {
      conditions.push(eq(plantsTable.categoryId, parseInt(categoryId as string)));
    }
    if (minPrice) {
      conditions.push(gte(plantsTable.price, parseFloat(minPrice as string)));
    }
    if (maxPrice) {
      conditions.push(lte(plantsTable.price, parseFloat(maxPrice as string)));
    }
    if (minHeight) {
      conditions.push(gte(plantsTable.height, parseFloat(minHeight as string)));
    }
    if (maxHeight) {
      conditions.push(lte(plantsTable.height, parseFloat(maxHeight as string)));
    }
    if (available === "true") {
      conditions.push(gt(plantsTable.stockQuantity, 0));
    }
    if (search) {
      const searchStr = `%${search}%`;
      conditions.push(
        or(
          like(plantsTable.nameAr, searchStr),
          like(plantsTable.nameEn, searchStr)
        )
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const plants = await db.select().from(plantsTable).where(where).orderBy(plantsTable.createdAt);

    const enriched = await Promise.all(plants.map(enrichPlant));
    res.json(enriched);
  } catch (err) {
    console.error("Get plants error:", err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get plants" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const plants = await db.select().from(plantsTable).where(eq(plantsTable.id, id)).limit(1);
    if (!plants[0]) {
      res.status(404).json({ error: "Not Found", message: "Plant not found" });
      return;
    }
    const enriched = await enrichPlant(plants[0]);
    res.json(enriched);
  } catch (err) {
    console.error("Get plant error:", err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get plant" });
  }
});

router.post("/", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { nameAr, nameEn, categoryId, descriptionAr, descriptionEn, height, price, stockQuantity, imageUrl, images, featured } = req.body;
    if (!nameAr || !nameEn || price == null || stockQuantity == null) {
      res.status(400).json({ error: "Bad Request", message: "nameAr, nameEn, price, and stockQuantity are required" });
      return;
    }
    const [plant] = await db.insert(plantsTable).values({
      nameAr,
      nameEn,
      categoryId: categoryId || null,
      descriptionAr: descriptionAr || null,
      descriptionEn: descriptionEn || null,
      height: height || null,
      price,
      stockQuantity,
      imageUrl: imageUrl || null,
      images: images || [],
      featured: featured || false,
    }).returning();
    const enriched = await enrichPlant(plant);
    res.status(201).json(enriched);
  } catch (err) {
    console.error("Create plant error:", err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to create plant" });
  }
});

router.put("/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const { nameAr, nameEn, categoryId, descriptionAr, descriptionEn, height, price, stockQuantity, imageUrl, images, featured } = req.body;
    const [plant] = await db.update(plantsTable).set({
      nameAr,
      nameEn,
      categoryId: categoryId || null,
      descriptionAr: descriptionAr || null,
      descriptionEn: descriptionEn || null,
      height: height || null,
      price,
      stockQuantity,
      imageUrl: imageUrl || null,
      images: images || [],
      featured: featured || false,
      updatedAt: new Date(),
    }).where(eq(plantsTable.id, id)).returning();
    if (!plant) {
      res.status(404).json({ error: "Not Found", message: "Plant not found" });
      return;
    }
    const enriched = await enrichPlant(plant);
    res.json(enriched);
  } catch (err) {
    console.error("Update plant error:", err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to update plant" });
  }
});

router.post("/import", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { plants: plantsData } = req.body;
    if (!Array.isArray(plantsData) || plantsData.length === 0) {
      res.status(400).json({ error: "Bad Request", message: "plants array is required and must not be empty" });
      return;
    }

    const results: Array<{ index: number; success: boolean; nameEn: string; error?: string }> = [];
    let successCount = 0;

    for (let i = 0; i < plantsData.length; i++) {
      const p = plantsData[i];
      try {
        if (!p.nameEn || !p.nameAr || p.price == null || p.stockQuantity == null) {
          results.push({ index: i, success: false, nameEn: p.nameEn || `Row ${i + 2}`, error: "Missing required fields: nameEn, nameAr, price, stockQuantity" });
          continue;
        }
        await db.insert(plantsTable).values({
          nameEn: String(p.nameEn).trim(),
          nameAr: String(p.nameAr).trim(),
          categoryId: p.categoryId ? Number(p.categoryId) : null,
          descriptionEn: p.descriptionEn ? String(p.descriptionEn).trim() : null,
          descriptionAr: p.descriptionAr ? String(p.descriptionAr).trim() : null,
          height: p.height ? Number(p.height) : null,
          price: Number(p.price),
          stockQuantity: Number(p.stockQuantity),
          imageUrl: p.imageUrl ? String(p.imageUrl).trim() : null,
          images: [],
          featured: String(p.featured).toLowerCase() === "true",
        });
        results.push({ index: i, success: true, nameEn: p.nameEn });
        successCount++;
      } catch (err: any) {
        results.push({ index: i, success: false, nameEn: p.nameEn || `Row ${i + 2}`, error: err.message });
      }
    }

    res.status(201).json({ imported: successCount, total: plantsData.length, results });
  } catch (err) {
    console.error("Import plants error:", err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to import plants" });
  }
});

router.delete("/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(String(req.params.id));
    await db.delete(plantsTable).where(eq(plantsTable.id, id));
    res.status(204).send();
  } catch (err) {
    console.error("Delete plant error:", err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to delete plant" });
  }
});

router.patch("/:id/stock", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const { stockQuantity } = req.body;
    if (stockQuantity == null) {
      res.status(400).json({ error: "Bad Request", message: "stockQuantity is required" });
      return;
    }
    const [plant] = await db.update(plantsTable).set({ stockQuantity, updatedAt: new Date() }).where(eq(plantsTable.id, id)).returning();
    if (!plant) {
      res.status(404).json({ error: "Not Found", message: "Plant not found" });
      return;
    }
    const enriched = await enrichPlant(plant);
    res.json(enriched);
  } catch (err) {
    console.error("Update stock error:", err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to update stock" });
  }
});

export default router;
