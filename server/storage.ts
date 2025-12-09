import { 
  type User, type InsertUser, 
  type Facility, type InsertFacility,
  type Booking, type InsertBooking, type BookingWithRelations,
  type Notification, type InsertNotification,
  users, facilities, bookings, notifications
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  updateUserPassword(id: number, hashedPassword: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(id: number, role: "student" | "faculty" | "admin"): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Facilities
  getFacility(id: number): Promise<Facility | undefined>;
  getAllFacilities(): Promise<Facility[]>;
  createFacility(facility: InsertFacility): Promise<Facility>;
  updateFacility(id: number, data: Partial<InsertFacility>): Promise<Facility | undefined>;
  deleteFacility(id: number): Promise<boolean>;

  // Bookings
  getBooking(id: number): Promise<BookingWithRelations | undefined>;
  getAllBookings(): Promise<BookingWithRelations[]>;
  getUserBookings(userId: number): Promise<BookingWithRelations[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: number, status: "pending" | "approved" | "rejected", adminId: number, notes?: string): Promise<Booking | undefined>;
  getBookingStats(): Promise<{ pending: number; approved: number; rejected: number; total: number }>;

  // Notifications
  getUserNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number): Promise<boolean>;
  markAllNotificationsRead(userId: number): Promise<boolean>;
  getUnreadCount(userId: number): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const [newUser] = await db.insert(users).values({
      ...user,
      password: hashedPassword,
    }).returning();
    return newUser;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async updateUserPassword(id: number, hashedPassword: string): Promise<boolean> {
    const result = await db.update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, id));
    return true;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserRole(id: number, role: "student" | "faculty" | "admin"): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async deleteUser(id: number): Promise<boolean> {
    await db.delete(users).where(eq(users.id, id));
    return true;
  }

  // Facilities
  async getFacility(id: number): Promise<Facility | undefined> {
    const [facility] = await db.select().from(facilities).where(eq(facilities.id, id));
    return facility;
  }

  async getAllFacilities(): Promise<Facility[]> {
    return db.select().from(facilities).orderBy(facilities.name);
  }

  async createFacility(facility: InsertFacility): Promise<Facility> {
    const [newFacility] = await db.insert(facilities).values(facility).returning();
    return newFacility;
  }

  async updateFacility(id: number, data: Partial<InsertFacility>): Promise<Facility | undefined> {
    const [updated] = await db.update(facilities)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(facilities.id, id))
      .returning();
    return updated;
  }

  async deleteFacility(id: number): Promise<boolean> {
    await db.delete(facilities).where(eq(facilities.id, id));
    return true;
  }

  // Bookings
  async getBooking(id: number): Promise<BookingWithRelations | undefined> {
    const result = await db.query.bookings.findFirst({
      where: eq(bookings.id, id),
      with: {
        user: true,
        facility: true,
        reviewer: true,
      },
    });
    return result as BookingWithRelations | undefined;
  }

  async getAllBookings(): Promise<BookingWithRelations[]> {
    const result = await db.query.bookings.findMany({
      with: {
        user: true,
        facility: true,
        reviewer: true,
      },
      orderBy: desc(bookings.createdAt),
    });
    return result as BookingWithRelations[];
  }

  async getUserBookings(userId: number): Promise<BookingWithRelations[]> {
    const result = await db.query.bookings.findMany({
      where: eq(bookings.userId, userId),
      with: {
        user: true,
        facility: true,
        reviewer: true,
      },
      orderBy: desc(bookings.createdAt),
    });
    return result as BookingWithRelations[];
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [newBooking] = await db.insert(bookings).values(booking).returning();
    return newBooking;
  }

  async updateBookingStatus(
    id: number, 
    status: "pending" | "approved" | "rejected", 
    adminId: number, 
    notes?: string
  ): Promise<Booking | undefined> {
    const [updated] = await db.update(bookings)
      .set({ 
        status, 
        reviewedBy: adminId, 
        reviewedAt: new Date(),
        adminNotes: notes,
        updatedAt: new Date() 
      })
      .where(eq(bookings.id, id))
      .returning();
    return updated;
  }

  async getBookingStats(): Promise<{ pending: number; approved: number; rejected: number; total: number }> {
    const allBookings = await db.select().from(bookings);
    const stats = {
      pending: allBookings.filter(b => b.status === "pending").length,
      approved: allBookings.filter(b => b.status === "approved").length,
      rejected: allBookings.filter(b => b.status === "rejected").length,
      total: allBookings.length,
    };
    return stats;
  }

  // Notifications
  async getUserNotifications(userId: number): Promise<Notification[]> {
    return db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationRead(id: number): Promise<boolean> {
    await db.update(notifications)
      .set({ status: "read" })
      .where(eq(notifications.id, id));
    return true;
  }

  async markAllNotificationsRead(userId: number): Promise<boolean> {
    await db.update(notifications)
      .set({ status: "read" })
      .where(eq(notifications.userId, userId));
    return true;
  }

  async getUnreadCount(userId: number): Promise<number> {
    const unread = await db.select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.status, "unread")));
    return unread.length;
  }
}

export const storage = new DatabaseStorage();
