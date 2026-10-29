import {
  bigint,
  boolean,
  foreignKey,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

const timestamps = {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
};

export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 160 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  subtitle: varchar("subtitle", { length: 240 }),
  description: text("description").notNull(),
  material: text("material"),
  care: text("care"),
  productInformation: json("product_information"),
  status: mysqlEnum("status", ["draft", "active", "archived"]).default("draft").notNull(),
  taxRateBps: int("tax_rate_bps").default(2400).notNull(),
  ...timestamps,
}, (table) => [uniqueIndex("products_slug_unique").on(table.slug)]);

export const designs = mysqlTable("designs", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  slug: varchar("slug", { length: 120 }).notNull(),
  name: varchar("name", { length: 140 }).notNull(),
  nameEl: varchar("name_el", { length: 140 }),
  story: text("story"),
  descriptionEl: text("description_el"),
  descriptionEn: text("description_en"),
  detailsEl: text("details_el"),
  detailsEn: text("details_en"),
  fixedColourId: int("fixed_colour_id"),
  sortOrder: int("sort_order").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  ...timestamps,
}, (table) => [
  uniqueIndex("designs_product_slug_unique").on(table.productId, table.slug),
  index("designs_product_idx").on(table.productId),
]);

export const colours = mysqlTable("colours", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  hex: varchar("hex", { length: 9 }),
  sortOrder: int("sort_order").default(0).notNull(),
  ...timestamps,
}, (table) => [uniqueIndex("colours_slug_unique").on(table.slug)]);

export const sizes = mysqlTable("sizes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 24 }).notNull(),
  label: varchar("label", { length: 80 }).notNull(),
  sortOrder: int("sort_order").default(0).notNull(),
  ...timestamps,
}, (table) => [uniqueIndex("sizes_code_unique").on(table.code)]);

export const productVariants = mysqlTable("product_variants", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  designId: int("design_id").notNull().references(() => designs.id),
  colourId: int("colour_id").notNull().references(() => colours.id),
  sizeId: int("size_id").notNull().references(() => sizes.id),
  sku: varchar("sku", { length: 80 }).notNull(),
  priceMinor: int("price_minor").notNull(),
  currency: varchar("currency", { length: 3 }).default("EUR").notNull(),
  active: boolean("active").default(true).notNull(),
  ...timestamps,
}, (table) => [
  uniqueIndex("product_variants_sku_unique").on(table.sku),
  uniqueIndex("product_variants_option_unique").on(table.productId, table.designId, table.colourId, table.sizeId),
  index("product_variants_product_idx").on(table.productId),
]);

export const productImages = mysqlTable("product_images", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  designId: int("design_id").references(() => designs.id, { onDelete: "set null" }),
  colourId: int("colour_id").references(() => colours.id, { onDelete: "set null" }),
  sizeId: int("size_id").references(() => sizes.id, { onDelete: "set null" }),
  src: varchar("src", { length: 500 }).notNull(),
  alt: varchar("alt", { length: 240 }).notNull(),
  altEl: varchar("alt_el", { length: 240 }),
  altEn: varchar("alt_en", { length: 240 }),
  sortOrder: int("sort_order").default(0).notNull(),
  ...timestamps,
}, (table) => [
  index("product_images_product_idx").on(table.productId),
  index("product_images_design_size_idx").on(table.designId, table.sizeId, table.sortOrder),
]);

export const inventory = mysqlTable("inventory", {
  id: int("id").autoincrement().primaryKey(),
  variantId: int("variant_id").notNull().references(() => productVariants.id, { onDelete: "cascade" }),
  onHand: int("on_hand").default(0).notNull(),
  reserved: int("reserved").default(0).notNull(),
  ...timestamps,
}, (table) => [uniqueIndex("inventory_variant_unique").on(table.variantId)]);

export const inventoryMovements = mysqlTable("inventory_movements", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  variantId: int("variant_id").notNull().references(() => productVariants.id),
  orderId: bigint("order_id", { mode: "number" }),
  quantityDelta: int("quantity_delta").notNull(),
  reason: mysqlEnum("reason", ["seed", "adjustment", "reservation", "release", "sale", "return"]).notNull(),
  note: varchar("note", { length: 300 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [index("inventory_movements_variant_idx").on(table.variantId)]);

export const customers = mysqlTable("customers", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  email: varchar("email", { length: 254 }).notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  phone: varchar("phone", { length: 40 }),
  ...timestamps,
}, (table) => [uniqueIndex("customers_email_unique").on(table.email)]);

export const contactEnquiries = mysqlTable("contact_enquiries", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  publicId: varchar("public_id", { length: 36 }).notNull(),
  name: varchar("name", { length: 140 }).notNull(),
  email: varchar("email", { length: 254 }).notNull(),
  subject: mysqlEnum("subject", ["order_question", "fit_sizing", "press", "stockist", "collaboration"]).notNull(),
  orderNumber: varchar("order_number", { length: 40 }),
  message: text("message").notNull(),
  locale: mysqlEnum("locale", ["el", "en"]).default("el").notNull(),
  status: mysqlEnum("status", ["new", "read", "replied", "closed"]).default("new").notNull(),
  rateLimitKey: varchar("rate_limit_key", { length: 64 }).notNull(),
  anonymizedAt: timestamp("anonymized_at"),
  ...timestamps,
}, (table) => [
  uniqueIndex("contact_enquiries_public_id_unique").on(table.publicId),
  index("contact_enquiries_status_created_idx").on(table.status, table.createdAt),
  index("contact_enquiries_email_idx").on(table.email),
]);

export const contactEnquiryRateLimits = mysqlTable("contact_enquiry_rate_limits", {
  rateLimitKey: varchar("rate_limit_key", { length: 64 }).primaryKey(),
  windowStartedAt: timestamp("window_started_at").defaultNow().notNull(),
  submissionCount: int("submission_count").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const commerceRateLimits = mysqlTable("commerce_rate_limits", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  scope: mysqlEnum("scope", ["order", "payment"]).notNull(),
  rateLimitKey: varchar("rate_limit_key", { length: 64 }).notNull(),
  windowStartedAt: timestamp("window_started_at").defaultNow().notNull(),
  submissionCount: int("submission_count").default(0).notNull(),
  blockedCount: int("blocked_count").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("commerce_rate_limits_scope_key_unique").on(table.scope, table.rateLimitKey),
  index("commerce_rate_limits_window_idx").on(table.windowStartedAt),
]);

export const privacyRetentionRuns = mysqlTable("privacy_retention_runs", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  mode: mysqlEnum("mode", ["dry_run", "apply"]).notNull(),
  retentionDays: int("retention_days").notNull(),
  eligibleCount: int("eligible_count").default(0).notNull(),
  anonymizedCount: int("anonymized_count").default(0).notNull(),
  status: mysqlEnum("status", ["completed", "disabled", "failed"]).notNull(),
  detail: json("detail"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orders = mysqlTable("orders", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  publicId: varchar("public_id", { length: 36 }).notNull(),
  orderNumber: varchar("order_number", { length: 40 }).notNull(),
  customerId: bigint("customer_id", { mode: "number" }).references(() => customers.id, { onDelete: "set null" }),
  email: varchar("email", { length: 254 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("EUR").notNull(),
  subtotalMinor: int("subtotal_minor").notNull(),
  shippingMinor: int("shipping_minor").default(0).notNull(),
  taxMinor: int("tax_minor").default(0).notNull(),
  discountMinor: int("discount_minor").default(0).notNull(),
  totalMinor: int("total_minor").notNull(),
  status: mysqlEnum("status", ["draft", "pending_payment", "paid", "processing", "shipped", "completed", "payment_failed", "cancelled", "partially_refunded", "refunded"]).default("draft").notNull(),
  paymentStatus: mysqlEnum("payment_status", ["unpaid", "pending", "authorized", "paid", "partially_refunded", "refunded", "failed", "cancelled"]).default("unpaid").notNull(),
  fulfilmentStatus: mysqlEnum("fulfilment_status", ["unfulfilled", "processing", "shipped", "delivered", "returned", "cancelled"]).default("unfulfilled").notNull(),
  reservationExpiresAt: timestamp("reservation_expires_at"),
  reservationReleasedAt: timestamp("reservation_released_at"),
  ...timestamps,
}, (table) => [
  uniqueIndex("orders_public_id_unique").on(table.publicId),
  uniqueIndex("orders_order_number_unique").on(table.orderNumber),
  index("orders_email_idx").on(table.email),
  index("orders_created_idx").on(table.createdAt),
  index("orders_reservation_expiry_idx").on(table.status, table.reservationExpiresAt),
]);

export const orderItems = mysqlTable("order_items", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  orderId: bigint("order_id", { mode: "number" }).notNull().references(() => orders.id, { onDelete: "cascade" }),
  variantId: int("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
  sku: varchar("sku", { length: 80 }).notNull(),
  productTitle: varchar("product_title", { length: 180 }).notNull(),
  designName: varchar("design_name", { length: 140 }).notNull(),
  colourName: varchar("colour_name", { length: 120 }).notNull(),
  sizeLabel: varchar("size_label", { length: 80 }).notNull(),
  unitPriceMinor: int("unit_price_minor").notNull(),
  quantity: int("quantity").notNull(),
  taxMinor: int("tax_minor").default(0).notNull(),
  totalMinor: int("total_minor").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [index("order_items_order_idx").on(table.orderId)]);

export const orderAddresses = mysqlTable("order_addresses", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  orderId: bigint("order_id", { mode: "number" }).notNull().references(() => orders.id, { onDelete: "cascade" }),
  type: mysqlEnum("type", ["billing", "shipping"]).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  company: varchar("company", { length: 160 }),
  documentType: mysqlEnum("document_type", ["receipt", "invoice"]),
  vatNumber: varchar("vat_number", { length: 20 }),
  taxOffice: varchar("tax_office", { length: 120 }),
  businessActivity: varchar("business_activity", { length: 180 }),
  line1: varchar("line1", { length: 200 }).notNull(),
  line2: varchar("line2", { length: 200 }),
  city: varchar("city", { length: 120 }).notNull(),
  region: varchar("region", { length: 120 }),
  postalCode: varchar("postal_code", { length: 24 }).notNull(),
  countryCode: varchar("country_code", { length: 2 }).notNull(),
  phone: varchar("phone", { length: 40 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [uniqueIndex("order_addresses_order_type_unique").on(table.orderId, table.type)]);

export const orderStatusEvents = mysqlTable("order_status_events", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  orderId: bigint("order_id", { mode: "number" }).notNull().references(() => orders.id, { onDelete: "cascade" }),
  fromStatus: varchar("from_status", { length: 40 }),
  toStatus: varchar("to_status", { length: 40 }).notNull(),
  actorType: mysqlEnum("actor_type", ["system", "customer", "admin", "provider"]).notNull(),
  note: varchar("note", { length: 300 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [index("order_status_events_order_idx").on(table.orderId)]);

export const payments = mysqlTable("payments", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  orderId: bigint("order_id", { mode: "number" }).notNull().references(() => orders.id),
  provider: mysqlEnum("provider", ["fake", "stripe", "paypal", "nbg", "worldline"]).notNull(),
  providerPaymentId: varchar("provider_payment_id", { length: 190 }),
  amountMinor: int("amount_minor").notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),
  status: mysqlEnum("status", ["created", "pending", "authorized", "captured", "failed", "cancelled", "partially_refunded", "refunded"]).default("created").notNull(),
  failureCode: varchar("failure_code", { length: 100 }),
  failureMessage: varchar("failure_message", { length: 300 }),
  ...timestamps,
}, (table) => [
  uniqueIndex("payments_provider_id_unique").on(table.provider, table.providerPaymentId),
  index("payments_order_idx").on(table.orderId),
]);

export const paymentEvents = mysqlTable("payment_events", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  paymentId: bigint("payment_id", { mode: "number" }).references(() => payments.id),
  provider: mysqlEnum("provider", ["fake", "stripe", "paypal", "nbg", "worldline"]).notNull(),
  providerEventId: varchar("provider_event_id", { length: 190 }).notNull(),
  eventType: varchar("event_type", { length: 120 }).notNull(),
  payloadHash: varchar("payload_hash", { length: 64 }).notNull(),
  processingStatus: mysqlEnum("processing_status", ["received", "processed", "ignored", "failed"]).default("received").notNull(),
  sanitizedPayload: json("sanitized_payload"),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
}, (table) => [uniqueIndex("payment_events_provider_event_unique").on(table.provider, table.providerEventId)]);

export const refunds = mysqlTable("refunds", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  paymentId: bigint("payment_id", { mode: "number" }).notNull().references(() => payments.id),
  providerRefundId: varchar("provider_refund_id", { length: 190 }),
  amountMinor: int("amount_minor").notNull(),
  reason: varchar("reason", { length: 300 }),
  status: mysqlEnum("status", ["pending", "succeeded", "failed", "cancelled"]).default("pending").notNull(),
  ...timestamps,
}, (table) => [uniqueIndex("refunds_provider_id_unique").on(table.providerRefundId)]);

export const adminUsers = mysqlTable("admin_users", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 100 }).notNull(),
  email: varchar("email", { length: 254 }),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["owner", "manager", "fulfilment", "viewer"]).default("owner").notNull(),
  active: boolean("active").default(true).notNull(),
  lastLoginAt: timestamp("last_login_at"),
  ...timestamps,
}, (table) => [uniqueIndex("admin_users_username_unique").on(table.username)]);

export const designFactApprovals = mysqlTable("design_fact_approvals", {
  id: int("id").autoincrement().primaryKey(),
  designId: int("design_id").notNull().references(() => designs.id, { onDelete: "cascade" }),
  category: mysqlEnum("category", ["composition", "measurements_fit", "opacity", "care", "provenance", "final_media"]).notNull(),
  status: mysqlEnum("status", ["pending", "approved"]).default("pending").notNull(),
  approvedByAdminId: int("approved_by_admin_id").references(() => adminUsers.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at"),
  ...timestamps,
}, (table) => [
  uniqueIndex("design_fact_approvals_design_category_unique").on(table.designId, table.category),
  index("design_fact_approvals_status_idx").on(table.status),
]);

export const shipments = mysqlTable("shipments", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  orderId: bigint("order_id", { mode: "number" }).notNull().references(() => orders.id, { onDelete: "cascade" }),
  carrierName: varchar("carrier_name", { length: 120 }).notNull(),
  trackingCode: varchar("tracking_code", { length: 120 }).notNull(),
  trackingUrl: varchar("tracking_url", { length: 500 }),
  createdByAdminId: int("created_by_admin_id").references(() => adminUsers.id, { onDelete: "set null" }),
  shippedAt: timestamp("shipped_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("shipments_order_unique").on(table.orderId),
  uniqueIndex("shipments_carrier_tracking_unique").on(table.carrierName, table.trackingCode),
]);

export const returnRequests = mysqlTable("return_requests", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  publicId: varchar("public_id", { length: 36 }).notNull(),
  orderId: bigint("order_id", { mode: "number" }).notNull().references(() => orders.id, { onDelete: "cascade" }),
  reason: mysqlEnum("reason", ["size_fit", "changed_mind", "damaged", "incorrect_item", "other"]).notNull(),
  customerNote: varchar("customer_note", { length: 500 }).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "received", "closed"]).default("pending").notNull(),
  adminNote: varchar("admin_note", { length: 500 }),
  reviewedByAdminId: int("reviewed_by_admin_id").references(() => adminUsers.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at"),
  ...timestamps,
}, (table) => [
  uniqueIndex("return_requests_public_id_unique").on(table.publicId),
  uniqueIndex("return_requests_order_unique").on(table.orderId),
  index("return_requests_status_created_idx").on(table.status, table.createdAt),
]);

export const adminSessions = mysqlTable("admin_sessions", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  adminUserId: int("admin_user_id").notNull().references(() => adminUsers.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 64 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [uniqueIndex("admin_sessions_token_unique").on(table.tokenHash)]);

export const adminAuditEvents = mysqlTable("admin_audit_events", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  adminUserId: int("admin_user_id").references(() => adminUsers.id, { onDelete: "set null" }),
  action: varchar("action", { length: 120 }).notNull(),
  entityType: varchar("entity_type", { length: 80 }).notNull(),
  entityId: varchar("entity_id", { length: 100 }),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [index("admin_audit_events_actor_idx").on(table.adminUserId)]);

export const adminNotifications = mysqlTable("admin_notifications", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  deduplicationKey: varchar("deduplication_key", { length: 190 }).notNull(),
  kind: mysqlEnum("kind", ["verified_sale", "payment_attention", "email_failed", "low_stock", "return_pending", "enquiry_new"]).notNull(),
  severity: mysqlEnum("severity", ["critical", "action", "information"]).notNull(),
  audience: mysqlEnum("audience", ["all", "commerce", "catalogue", "owner_manager"]).default("all").notNull(),
  entityType: varchar("entity_type", { length: 80 }).notNull(),
  entityId: varchar("entity_id", { length: 100 }).notNull(),
  href: varchar("href", { length: 500 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [uniqueIndex("admin_notifications_dedupe_unique").on(table.deduplicationKey), index("admin_notifications_severity_created_idx").on(table.severity, table.createdAt)]);

export const adminNotificationStates = mysqlTable("admin_notification_states", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  notificationId: bigint("notification_id", { mode: "number" }).notNull(),
  adminUserId: int("admin_user_id").notNull(),
  readAt: timestamp("read_at"),
  archivedAt: timestamp("archived_at"),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("admin_notification_states_admin_notification_unique").on(table.adminUserId, table.notificationId), index("admin_notification_states_admin_archive_idx").on(table.adminUserId, table.archivedAt), foreignKey({ columns:[table.notificationId], foreignColumns:[adminNotifications.id], name:"admin_notice_state_notice_fk" }).onDelete("cascade"), foreignKey({ columns:[table.adminUserId], foreignColumns:[adminUsers.id], name:"admin_notice_state_user_fk" }).onDelete("cascade")]);

export const storeInformationPages = mysqlTable("store_information_pages", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["draft", "published"]).default("draft").notNull(),
  eyebrowEl: varchar("eyebrow_el", { length: 160 }).notNull(),
  eyebrowEn: varchar("eyebrow_en", { length: 160 }).notNull(),
  titleEl: varchar("title_el", { length: 180 }).notNull(),
  titleEn: varchar("title_en", { length: 180 }).notNull(),
  introEl: text("intro_el").notNull(),
  introEn: text("intro_en").notNull(),
  sections: json("sections").notNull(),
  ...timestamps,
}, (table) => [uniqueIndex("store_information_pages_slug_unique").on(table.slug)]);

export const privacyRequests = mysqlTable("privacy_requests", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  publicId: varchar("public_id", { length: 36 }).notNull(),
  subjectEmail: varchar("subject_email", { length: 254 }).notNull(),
  requestType: mysqlEnum("request_type", ["export", "erasure"]).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "blocked_legal_review", "failed"]).default("pending").notNull(),
  requestedByAdminId: int("requested_by_admin_id").references(() => adminUsers.id, { onDelete: "set null" }),
  result: json("result"),
  completedAt: timestamp("completed_at"),
  ...timestamps,
}, (table) => [
  uniqueIndex("privacy_requests_public_id_unique").on(table.publicId),
  index("privacy_requests_email_created_idx").on(table.subjectEmail, table.createdAt),
]);

export const emailTemplates = mysqlTable("email_templates", {
  id: int("id").autoincrement().primaryKey(),
  templateKey: varchar("template_key", { length: 100 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  system: boolean("system").default(false).notNull(),
  status: mysqlEnum("status", ["draft", "active", "archived"]).default("draft").notNull(),
  activeVersionId: bigint("active_version_id", { mode: "number" }),
  ...timestamps,
}, (table) => [uniqueIndex("email_templates_key_unique").on(table.templateKey), index("email_templates_status_idx").on(table.status)]);

export const emailTemplateVersions = mysqlTable("email_template_versions", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  templateId: int("template_id").notNull(),
  version: int("version").notNull(),
  subjectEl: varchar("subject_el", { length: 240 }).notNull(),
  subjectEn: varchar("subject_en", { length: 240 }).notNull(),
  htmlEl: text("html_el").notNull(),
  htmlEn: text("html_en").notNull(),
  textEl: text("text_el").notNull(),
  textEn: text("text_en").notNull(),
  allowedVariables: json("allowed_variables").notNull(),
  createdByAdminId: int("created_by_admin_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [uniqueIndex("email_template_versions_template_version_unique").on(table.templateId, table.version), foreignKey({ columns:[table.templateId], foreignColumns:[emailTemplates.id], name:"email_version_template_fk" }).onDelete("cascade"), foreignKey({ columns:[table.createdByAdminId], foreignColumns:[adminUsers.id], name:"email_version_admin_fk" }).onDelete("set null")]);

export const emailDeliveries = mysqlTable("email_deliveries", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  orderId: bigint("order_id", { mode: "number" }).references(() => orders.id, { onDelete: "set null" }),
  contactEnquiryId: bigint("contact_enquiry_id", { mode: "number" }).references(() => contactEnquiries.id, { onDelete: "set null" }),
  template: mysqlEnum("template", ["payment_confirmation", "admin_new_order", "fulfilment_update", "contact_enquiry_notification", "admin_return_request", "return_status_update"]).notNull(),
  recipient: varchar("recipient", { length: 254 }).notNull(),
  replyTo: varchar("reply_to", { length: 254 }),
  idempotencyKey: varchar("idempotency_key", { length: 190 }).notNull(),
  status: mysqlEnum("status", ["queued", "sending", "sent", "failed"]).default("queued").notNull(),
  attemptCount: int("attempt_count").default(0).notNull(),
  providerMessageId: varchar("provider_message_id", { length: 255 }),
  context: json("context"),
  templateVersionId: bigint("template_version_id", { mode: "number" }),
  subjectSnapshot: varchar("subject_snapshot", { length: 240 }),
  textSnapshot: text("text_snapshot"),
  htmlSnapshot: text("html_snapshot"),
  lastError: varchar("last_error", { length: 300 }),
  sentAt: timestamp("sent_at"),
  ...timestamps,
}, (table) => [
  uniqueIndex("email_deliveries_idempotency_unique").on(table.idempotencyKey),
  index("email_deliveries_status_idx").on(table.status, table.createdAt),
  index("email_deliveries_contact_enquiry_idx").on(table.contactEnquiryId),
  foreignKey({ columns:[table.templateVersionId], foreignColumns:[emailTemplateVersions.id], name:"email_delivery_version_fk" }).onDelete("set null"),
]);

export const automationJobs = mysqlTable("automation_jobs", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  publicId: varchar("public_id", { length: 36 }).notNull(),
  deduplicationKey: varchar("deduplication_key", { length: 190 }).notNull(),
  kind: mysqlEnum("kind", ["email_dispatch", "notification_sync", "reservation_release"]).notNull(),
  status: mysqlEnum("status", ["queued", "processing", "retry_wait", "completed", "failed", "cancelled"]).default("queued").notNull(),
  payload: json("payload"),
  runAt: timestamp("run_at").defaultNow().notNull(),
  attemptCount: int("attempt_count").default(0).notNull(),
  maxAttempts: int("max_attempts").default(5).notNull(),
  lockedAt: timestamp("locked_at"),
  lockedBy: varchar("locked_by", { length: 100 }),
  lastError: varchar("last_error", { length: 300 }),
  completedAt: timestamp("completed_at"),
  cancelledAt: timestamp("cancelled_at"),
  ...timestamps,
}, (table) => [
  uniqueIndex("automation_job_public_uq").on(table.publicId),
  uniqueIndex("automation_job_dedupe_uq").on(table.deduplicationKey),
  index("automation_job_due_idx").on(table.status, table.runAt),
  index("automation_job_lock_idx").on(table.status, table.lockedAt),
]);
