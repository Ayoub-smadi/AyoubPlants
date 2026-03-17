import { Router } from "express";
import { db } from "@workspace/db";
import { categoriesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { authenticateToken, requireAdmin, type AuthRequest } from "../lib/auth.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const categories = await db.select().from(categoriesTable).orderBy(categoriesTable.nameEn);
    res.json(categories);
  } catch (err) {
    console.error("Get categories error:", err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get categories" });
  }
});

router.post("/", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { nameAr, nameEn, description } = req.body;
    if (!nameAr || !nameEn) {
      res.status(400).json({ error: "Bad Request", message: "nameAr and nameEn are required" });
      return;
    }
    const [category] = await db.insert(categoriesTable).values({ nameAr, nameEn, description }).returning();
    res.status(201).json(category);
  } catch (err) {
    console.error("Create category error:", err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to create category" });
  }
});

router.put("/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const { nameAr, nameEn, description } = req.body;
    const [category] = await db
      .update(categoriesTable)
      .set({ nameAr, nameEn, description })
      .where(eq(categoriesTable.id, id))
      .returning();
    if (!category) {
      res.status(404).json({ error: "Not Found", message: "Category not found" });
      return;
    }
    res.json(category);
  } catch (err) {
    console.error("Update category error:", err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to update category" });
  }
});

router.delete("/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(String(req.params.id));
    await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
    res.status(204).send();
  } catch (err) {
    console.error("Delete category error:", err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to delete category" });
  }
});

export default router;
