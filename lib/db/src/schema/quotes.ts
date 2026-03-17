import { pgTable, text, serial, timestamp, integer, real, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { plantsTable } from "./plants";

export const quoteStatusEnum = pgEnum("quote_status", [
  "pending",
  "reviewed",
  "sent",
]);

export const quoteRequestsTable = pgTable("quote_requests", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  status: quoteStatusEnum("status").notNull().default("pending"),
  totalAmount: real("total_amount").notNull().default(0),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const quoteItemsTable = pgTable("quote_items", {
  id: serial("id").primaryKey(),
  quoteId: integer("quote_id").notNull().references(() => quoteRequestsTable.id, { onDelete: "cascade" }),
  plantId: integer("plant_id").notNull().references(() => plantsTable.id),
  plantNameAr: text("plant_name_ar").notNull(),
  plantNameEn: text("plant_name_en").notNull(),
  descriptionAr: text("description_ar"),
  descriptionEn: text("description_en"),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: real("unit_price").notNull(),
  totalPrice: real("total_price").notNull(),
});

export const insertQuoteRequestSchema = createInsertSchema(quoteRequestsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertQuoteItemSchema = createInsertSchema(quoteItemsTable).omit({ id: true });
export type InsertQuoteRequest = z.infer<typeof insertQuoteRequestSchema>;
export type InsertQuoteItem = z.infer<typeof insertQuoteItemSchema>;
export type QuoteRequest = typeof quoteRequestsTable.$inferSelect;
export type QuoteItem = typeof quoteItemsTable.$inferSelect;
