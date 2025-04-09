import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Store schema
export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url").notNull().unique(),
  logo: text("logo"),
  isPreset: boolean("is_preset").default(false),
});

export const insertStoreSchema = createInsertSchema(stores).pick({
  name: true,
  url: true,
  logo: true,
  isPreset: true,
});

// Product schema
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull(),
  name: text("name").notNull(),
  price: text("price").notNull(),
  imageUrl: text("image_url"),
  description: text("description"),
  url: text("url"),
  category: text("category"),
  metadata: jsonb("metadata"),
  createdAt: text("created_at").notNull(),
});

export const insertProductSchema = createInsertSchema(products).pick({
  storeId: true,
  name: true,
  price: true,
  imageUrl: true,
  description: true,
  url: true,
  category: true,
  metadata: true,
  createdAt: true,
});

// Define response types for the API
export const productSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  price: z.string(),
  imageUrl: z.string().optional(),
  description: z.string().optional(),
  url: z.string().optional(),
  category: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const scrapeResultSchema = z.object({
  storeName: z.string(),
  storeUrl: z.string(),
  products: z.array(productSchema),
  timestamp: z.string(),
});

// Export types
export type Store = typeof stores.$inferSelect;
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type ProductData = z.infer<typeof productSchema>;
export type ScrapeResult = z.infer<typeof scrapeResultSchema>;
