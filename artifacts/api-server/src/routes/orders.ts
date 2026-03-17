import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, orderItemsTable, plantsTable, usersTable } from "@workspace/db/schema";
import { eq, sql } from "drizzle-orm";
import { authenticateToken, optionalAuth, requireAdmin, type AuthRequest } from "../lib/auth.js";

const router = Router();

async function enrichOrder(order: typeof ordersTable.$inferSelect) {
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
  const enrichedItems = await Promise.all(items.map(async (item) => {
    const plants = await db.select().from(plantsTable).where(eq(plantsTable.id, item.plantId)).limit(1);
    return { ...item, plant: plants[0] || null };
  }));

  let user = null;
  if (order.userId) {
    const users = await db.select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      phone: usersTable.phone,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
    }).from(usersTable).where(eq(usersTable.id, order.userId)).limit(1);
    user = users[0] || null;
  }

  return { ...order, items: enrichedItems, user };
}

router.get("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    let orders;
    if (req.user!.role === "admin") {
      orders = await db.select().from(ordersTable).orderBy(sql`${ordersTable.createdAt} DESC`);
    } else {
      orders = await db.select().from(ordersTable).where(eq(ordersTable.userId, req.user!.userId)).orderBy(sql`${ordersTable.createdAt} DESC`);
    }
    const enriched = await Promise.all(orders.map(enrichOrder));
    res.json(enriched);
  } catch (err) {
    console.error("Get orders error:", err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get orders" });
  }
});

router.post("/", optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { customerName, customerPhone, customerAddress, notes, items } = req.body;
    if (!customerName || !customerPhone || !customerAddress || !items || items.length === 0) {
      res.status(400).json({ error: "Bad Request", message: "customerName, customerPhone, customerAddress, and items are required" });
      return;
    }

    let totalAmount = 0;
    const enrichedItems: Array<{ plantId: number; quantity: number; unitPrice: number; totalPrice: number }> = [];

    for (const item of items) {
      const plants = await db.select().from(plantsTable).where(eq(plantsTable.id, item.plantId)).limit(1);
      const plant = plants[0];
      if (!plant) {
        res.status(400).json({ error: "Bad Request", message: `Plant ${item.plantId} not found` });
        return;
      }
      if (plant.stockQuantity < item.quantity) {
        res.status(400).json({ error: "Bad Request", message: `Insufficient stock for ${plant.nameEn}` });
        return;
      }
      const itemTotal = plant.price * item.quantity;
      totalAmount += itemTotal;
      enrichedItems.push({
        plantId: item.plantId,
        quantity: item.quantity,
        unitPrice: plant.price,
        totalPrice: itemTotal,
      });
    }

    const [order] = await db.insert(ordersTable).values({
      userId: req.user?.userId || null,
      customerName,
      customerPhone,
      customerAddress,
      notes: notes || null,
      totalAmount,
      status: "pending",
    }).returning();

    for (const item of enrichedItems) {
      await db.insert(orderItemsTable).values({ orderId: order.id, ...item });
      await db.update(plantsTable).set({
        stockQuantity: sql`${plantsTable.stockQuantity} - ${item.quantity}`,
        updatedAt: new Date(),
      }).where(eq(plantsTable.id, item.plantId));
    }

    const enriched = await enrichOrder(order);
    res.status(201).json(enriched);
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to create order" });
  }
});

router.get("/:id", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const orders = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
    if (!orders[0]) {
      res.status(404).json({ error: "Not Found", message: "Order not found" });
      return;
    }
    const order = orders[0];
    if (req.user!.role !== "admin" && order.userId !== req.user!.userId) {
      res.status(403).json({ error: "Forbidden", message: "Access denied" });
      return;
    }
    const enriched = await enrichOrder(order);
    res.json(enriched);
  } catch (err) {
    console.error("Get order error:", err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to get order" });
  }
});

router.patch("/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ error: "Bad Request", message: "status is required" });
      return;
    }
    const [order] = await db.update(ordersTable).set({ status, updatedAt: new Date() }).where(eq(ordersTable.id, id)).returning();
    if (!order) {
      res.status(404).json({ error: "Not Found", message: "Order not found" });
      return;
    }
    const enriched = await enrichOrder(order);
    res.json(enriched);
  } catch (err) {
    console.error("Update order status error:", err);
    res.status(500).json({ error: "Internal Server Error", message: "Failed to update order status" });
  }
});

export default router;
