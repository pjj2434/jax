
import { sqliteTable, text, integer  } from "drizzle-orm/sqlite-core";
			
export const user = sqliteTable("user", {
					id: text("id").primaryKey(),
					name: text('name').notNull(),
 email: text('email').notNull().unique(),
 emailVerified: integer('email_verified', { mode: 'boolean' }).notNull(),
 image: text('image'),
 createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
 updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
				});

export const session = sqliteTable("session", {
					id: text("id").primaryKey(),
					expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
 token: text('token').notNull().unique(),
 createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
 updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
 ipAddress: text('ip_address'),
 userAgent: text('user_agent'),
 userId: text('user_id').notNull().references(()=> user.id, { onDelete: 'cascade' })
				});

export const account = sqliteTable("account", {
					id: text("id").primaryKey(),
					accountId: text('account_id').notNull(),
 providerId: text('provider_id').notNull(),
 userId: text('user_id').notNull().references(()=> user.id, { onDelete: 'cascade' }),
 accessToken: text('access_token'),
 refreshToken: text('refresh_token'),
 idToken: text('id_token'),
 accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
 refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
 scope: text('scope'),
 password: text('password'),
 createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
 updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull()
				});

export const verification = sqliteTable("verification", {
					id: text("id").primaryKey(),
					identifier: text('identifier').notNull(),
 value: text('value').notNull(),
 expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
 createdAt: integer('created_at', { mode: 'timestamp' }),
 updatedAt: integer('updated_at', { mode: 'timestamp' })
				});

export const messageBanner = sqliteTable("message_banner", {
  id: text("id").primaryKey(),
  message: text("message").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(false).notNull(),
  backgroundColor: text("background_color").default("#3B82F6").notNull(), // Default blue color
  textColor: text("text_color").default("#FFFFFF").notNull(), // Default white text
  showCloseButton: integer("show_close_button", { mode: "boolean" }).default(true).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
export const section = sqliteTable("section", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  order: integer("order").notNull().default(0), // For controlling display order
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  createdById: text("created_by_id").references(() => user.id),
});
// db/schema.ts - Updated event schema
export const event = sqliteTable("event", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  eventDate: integer("event_date", { mode: "timestamp" }),
  location: text("location"),
  maxAttendees: integer("max_attendees"),
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  showCapacity: integer("show_capacity", { mode: "boolean" }).default(true),
  sectionId: text("section_id").references(() => section.id, { onDelete: "set null" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  createdById: text("created_by_id"),
  
  // New fields
  eventType: text("event_type").notNull().default("event"), // "event" or "league"
  allowSignups: integer("allow_signups", { mode: "boolean" }).default(true),
  participantsPerSignup: integer("participants_per_signup").default(1),
  featuredImage: text("featured_image"),
  galleryImages: text("gallery_images"), // JSON string of image URLs
  detailedContent: text("detailed_content"), // Rich text content
});

// New schema for quick links
export const quickLink = sqliteTable("quick_link", {
  id: text("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => event.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  url: text("url").notNull(),
  order: integer("order").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Updated signup schema to handle multiple participants
export const signup = sqliteTable("signup", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  eventId: text("event_id").notNull().references(() => event.id, { onDelete: "cascade" }),
  notes: text("notes"),
  status: text("status").notNull().default("registered"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  
  // New fields for additional participants
  additionalParticipants: text("additional_participants"), // JSON string of participants
});


// Export types for TypeScript
export type Section = typeof section.$inferSelect;
export type NewSection = typeof section.$inferInsert;

export type Event = typeof event.$inferSelect;
export type NewEvent = typeof event.$inferInsert;

export type Signup = typeof signup.$inferSelect;
export type NewSignup = typeof signup.$inferInsert;
export type MessageBanner = typeof messageBanner.$inferSelect;
export type NewMessageBanner = typeof messageBanner.$inferInsert;