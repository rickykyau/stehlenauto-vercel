import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Vehicles a customer has saved (their "garage").
 * `userId` is the Clerk user ID. Up to 5 vehicles per user (enforced at app layer).
 */
export const vehicles = pgTable(
  "vehicles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    year: text("year").notNull(),
    make: text("make").notNull(),
    model: text("model").notNull(),
    label: text("label"),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    userYmm: uniqueIndex("vehicles_user_ymm_idx").on(
      t.userId,
      t.year,
      t.make,
      t.model,
    ),
  }),
);

/**
 * Sub-model answers (bed length, cab type, trim, doors) per vehicle.
 * Asked once per (vehicle, group), then auto-applied everywhere.
 * Guests use cookie storage; once they sign in, rows are migrated.
 */
export const subModelAnswers = pgTable(
  "sub_model_answers",
  {
    userId: text("user_id").notNull(),
    vehicleId: text("vehicle_id").notNull(),
    group: text("group").notNull(), // "bed_length" | "cab_type" | "trim" | "doors"
    value: text("value").notNull(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.vehicleId, t.group] }),
  }),
);

/**
 * Local cart mirror keyed off Shopify's cartId. We store cartId in a cookie,
 * and use this table to track who owns it (for hand-off when guests sign in).
 */
export const carts = pgTable("carts", {
  id: text("id").primaryKey(), // Shopify cart id (gid://shopify/Cart/...)
  userId: text("user_id"), // null until signed in
  itemCount: integer("item_count").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Wishlist items keyed off Clerk user + product handle.
 */
export const wishlistItems = pgTable(
  "wishlist_items",
  {
    userId: text("user_id").notNull(),
    productHandle: text("product_handle").notNull(),
    productTitle: text("product_title").notNull(),
    productImage: text("product_image"),
    productPrice: integer("product_price").notNull(),
    productSku: text("product_sku"),
    addedAt: timestamp("added_at").notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.productHandle] }),
  }),
);

/**
 * Search-miss log. Append-only row every time the predictive-search endpoint
 * returns zero suggestions for a query >= 2 chars. Drives the
 * `/admin/sourcing-gaps` zero-result section so the owner can see empirical
 * demand we're failing to meet.
 */
export const searchMisses = pgTable("search_misses", {
  id: text("id").primaryKey(),
  query: text("query").notNull(),
  vehicleId: text("vehicle_id"),
  vehicleMake: text("vehicle_make"),
  vehicleModel: text("vehicle_model"),
  vehicleYear: text("vehicle_year"),
  source: text("source").notNull().default("suggest"),
  occurredAt: timestamp("occurred_at").notNull().defaultNow(),
});

/**
 * Cycle 14BG (Mike new-customer ceiling): native review submissions
 * so PDPs without imported Amazon reviews can still earn social proof
 * from real customers. Submissions land in pending state — the admin
 * dashboard surfaces them for moderation before they go live on the
 * PDP. FTC/Google guidance: only "approved" reviews count toward
 * the aggregate displayed publicly.
 */
export const productReviews = pgTable("product_reviews", {
  id: text("id").primaryKey(),
  productHandle: text("product_handle").notNull(),
  userId: text("user_id"), // null = anonymous
  authorName: text("author_name").notNull(),
  authorEmail: text("author_email").notNull(),
  vehicleYear: text("vehicle_year"),
  vehicleMake: text("vehicle_make"),
  vehicleModel: text("vehicle_model"),
  stars: integer("stars").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  status: text("status").notNull().default("pending"), // pending | approved | rejected
  createdAt: timestamp("created_at").notNull().defaultNow(),
  approvedAt: timestamp("approved_at"),
});

/**
 * Internal staff recipients for new-order alert emails (managed in
 * /admin/notifications, fired by the Shopify orders/create webhook).
 */
export const notificationRecipients = pgTable("notification_recipients", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  label: text("label"), // optional name/role, e.g. "Warehouse" / "Sam"
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Vehicle = typeof vehicles.$inferSelect;
export type NotificationRecipient = typeof notificationRecipients.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;
export type SubModelAnswer = typeof subModelAnswers.$inferSelect;
export type Cart = typeof carts.$inferSelect;
export type WishlistItem = typeof wishlistItems.$inferSelect;
export type SearchMiss = typeof searchMisses.$inferSelect;
export type ProductReview = typeof productReviews.$inferSelect;
export type NewProductReview = typeof productReviews.$inferInsert;
