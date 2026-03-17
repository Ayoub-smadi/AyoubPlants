import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, orderItemsTable, plantsTable, usersTable } from "@workspace/db/schema";
import { sql, eq, gte, and } from "drizzle-orm";
import { authenticateToken, requireAdmin, type AuthRequest } from "../lib/auth.js";

const router = Router();

router.get("/summary", authenticateToken, requireAdmin, async (_req: AuthRequest, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [totalRev] = await db.select({ total: sql<number>`COALESCE(SUM(${ordersTable.totalAmount}), 0)` }).from(ordersTable);
    const [todayRev] = await db.select({ total: sql<number>`COALESCE(SUM(${ordersTable.totalAmount}), 0)` }).from(ordersTable).where(gte(ordersTable.createdAt, today));
    const [monthRev] = await db.select({ total: sql<number>`COALESCE(SUM(${ordersTable.totalAmount}), 0)` }).from(ordersTable).where(gte(ordersTable.createdAt, monthStart));

    const [totalOrd] = await db.select({ count: sql<number>`COUNT(*)` }).from(ordersTable);
    const [todayOrd] = await db.select({ count: sql<number>`COUNT(*)` }).from(ordersTable).where(gte(ordersTable.createdAt, today));
    const [monthOrd] = await db.select({ count: sql<number>`COUNT(*)` }).from(ordersTable).where(gte(ordersTable.createdAt, monthStart));

    const [totalPlants] = await db.select({ count: sql<number>`COUNT(*)` }).from(plantsTable);
    const [lowStock] = await db.select({ count: sql<number>`COUNT(*)` }).from(plantsTable).where(and(sql`${plantsTable.stockQuantity} <= 5`, sql`${plantsTable.stockQuantity} >= 0`));
    const [totalCustomers] = await db.select({ count: sql<number>`COUNT(*)` }).from(usersTable).where(eq(usersTable.role, "customer"));

    res.json({
      totalRevenue: Number(totalRev.total) || 0,
      todayRevenue: Number(todayRev.total) || 0,
      monthRevenue: Number(monthRev.total) || 0,
      totalOrders: Number(totalOrd.count) || 0,
      todayOrders: Number(todayOrd.count) || 0,
      monthOrders: Number(monthOrd.count) || 0,
      totalPlants: Number(totalPlants.count) || 0,
      lowStockPlants: Number(lowStock.count) || 0,
      totalCustomers: Number(totalCustomers.count) || 0,
    });
  } catch (err) {
    console.error("Get report summary error:", err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get report summary" });
  }
});

router.get("/daily", authenticateToken, requireAdmin, async (_req: AuthRequest, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await db.select({
      date: sql<string>`DATE(${ordersTable.createdAt})::text`,
      revenue: sql<number>`COALESCE(SUM(${ordersTable.totalAmount}), 0)`,
      orders: sql<number>`COUNT(*)`,
    })
      .from(ordersTable)
      .where(gte(ordersTable.createdAt, thirtyDaysAgo))
      .groupBy(sql`DATE(${ordersTable.createdAt})`)
      .orderBy(sql`DATE(${ordersTable.createdAt})`);

    res.json(result.map(r => ({
      date: r.date,
      revenue: Number(r.revenue) || 0,
      orders: Number(r.orders) || 0,
    })));
  } catch (err) {
    console.error("Get daily sales error:", err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get daily sales" });
  }
});

router.get("/top-plants", authenticateToken, requireAdmin, async (_req: AuthRequest, res) => {
  try {
    const result = await db.select({
      plantId: orderItemsTable.plantId,
      nameAr: plantsTable.nameAr,
      nameEn: plantsTable.nameEn,
      imageUrl: plantsTable.imageUrl,
      totalSold: sql<number>`SUM(${orderItemsTable.quantity})`,
      totalRevenue: sql<number>`SUM(${orderItemsTable.totalPrice})`,
    })
      .from(orderItemsTable)
      .innerJoin(plantsTable, eq(orderItemsTable.plantId, plantsTable.id))
      .groupBy(orderItemsTable.plantId, plantsTable.nameAr, plantsTable.nameEn, plantsTable.imageUrl)
      .orderBy(sql`SUM(${orderItemsTable.quantity}) DESC`)
      .limit(10);

    res.json(result.map(r => ({
      plantId: r.plantId,
      nameAr: r.nameAr,
      nameEn: r.nameEn,
      imageUrl: r.imageUrl,
      totalSold: Number(r.totalSold) || 0,
      totalRevenue: Number(r.totalRevenue) || 0,
    })));
  } catch (err) {
    console.error("Get top plants error:", err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get top plants" });
  }
});

export default router;
