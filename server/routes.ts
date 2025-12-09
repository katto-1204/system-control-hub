import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, insertFacilitySchema, insertBookingSchema,
  loginSchema, registerSchema
} from "@shared/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SESSION_SECRET || "facility-hub-secret-key";

interface AuthRequest extends Request {
  user?: { id: number; email: string; role: string };
}

function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string; role: string };
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}

function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Validation failed", errors: parsed.error.errors });
      }

      const { confirmPassword, ...userData } = parsed.data;
      
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const user = await storage.createUser(userData);
      const { password, ...userWithoutPassword } = user;
      
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.status(201).json({ user: userWithoutPassword, token });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Validation failed", errors: parsed.error.errors });
      }

      const { email, password } = parsed.data;
      const user = await storage.getUserByEmail(email);

      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const { password: _, ...userWithoutPassword } = user;
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // User Profile Routes
  app.patch("/api/users/profile", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { firstName, lastName, studentId } = req.body;
      const updated = await storage.updateUser(req.user!.id, { firstName, lastName, studentId });
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = updated;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.patch("/api/users/password", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await storage.getUser(req.user!.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUserPassword(req.user!.id, hashedPassword);
      
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Password change error:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Facilities Routes
  app.get("/api/facilities", async (req, res) => {
    try {
      const allFacilities = await storage.getAllFacilities();
      res.json(allFacilities);
    } catch (error) {
      console.error("Get facilities error:", error);
      res.status(500).json({ message: "Failed to get facilities" });
    }
  });

  app.get("/api/facilities/:id", async (req, res) => {
    try {
      const facility = await storage.getFacility(parseInt(req.params.id));
      if (!facility) {
        return res.status(404).json({ message: "Facility not found" });
      }
      res.json(facility);
    } catch (error) {
      console.error("Get facility error:", error);
      res.status(500).json({ message: "Failed to get facility" });
    }
  });

  // Bookings Routes
  app.get("/api/bookings/my", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userBookings = await storage.getUserBookings(req.user!.id);
      res.json(userBookings);
    } catch (error) {
      console.error("Get user bookings error:", error);
      res.status(500).json({ message: "Failed to get bookings" });
    }
  });

  app.post("/api/bookings", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const bookingData = {
        ...req.body,
        userId: req.user!.id,
      };

      const parsed = insertBookingSchema.safeParse(bookingData);
      if (!parsed.success) {
        return res.status(400).json({ message: "Validation failed", errors: parsed.error.errors });
      }

      const booking = await storage.createBooking(parsed.data);

      // Create notification for admins (simplified - in real app would notify all admins)
      await storage.createNotification({
        userId: req.user!.id,
        title: "Booking Request Submitted",
        message: `Your booking request for "${booking.eventName}" has been submitted and is pending review.`,
        type: "info",
        relatedBookingId: booking.id,
      });

      res.status(201).json(booking);
    } catch (error) {
      console.error("Create booking error:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.get("/api/bookings/stats", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const stats = await storage.getBookingStats();
      res.json(stats);
    } catch (error) {
      console.error("Get booking stats error:", error);
      res.status(500).json({ message: "Failed to get booking stats" });
    }
  });

  // Notifications Routes
  app.get("/api/notifications", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userNotifications = await storage.getUserNotifications(req.user!.id);
      res.json(userNotifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Failed to get notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", authenticateToken, async (req: AuthRequest, res) => {
    try {
      await storage.markNotificationRead(parseInt(req.params.id));
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch("/api/notifications/read-all", authenticateToken, async (req: AuthRequest, res) => {
    try {
      await storage.markAllNotificationsRead(req.user!.id);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Mark all notifications read error:", error);
      res.status(500).json({ message: "Failed to mark notifications as read" });
    }
  });

  // Admin Routes
  app.get("/api/admin/bookings", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const allBookings = await storage.getAllBookings();
      res.json(allBookings);
    } catch (error) {
      console.error("Admin get bookings error:", error);
      res.status(500).json({ message: "Failed to get bookings" });
    }
  });

  app.patch("/api/admin/bookings/:id/approve", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const { notes } = req.body;
      
      const updated = await storage.updateBookingStatus(bookingId, "approved", req.user!.id, notes);
      if (!updated) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Notify the user
      await storage.createNotification({
        userId: updated.userId,
        title: "Booking Approved",
        message: `Your booking request for "${updated.eventName}" has been approved!`,
        type: "success",
        relatedBookingId: updated.id,
      });

      res.json(updated);
    } catch (error) {
      console.error("Approve booking error:", error);
      res.status(500).json({ message: "Failed to approve booking" });
    }
  });

  app.patch("/api/admin/bookings/:id/reject", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const { notes } = req.body;
      
      const updated = await storage.updateBookingStatus(bookingId, "rejected", req.user!.id, notes);
      if (!updated) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Notify the user
      await storage.createNotification({
        userId: updated.userId,
        title: "Booking Rejected",
        message: `Your booking request for "${updated.eventName}" has been rejected. ${notes ? `Reason: ${notes}` : ""}`,
        type: "error",
        relatedBookingId: updated.id,
      });

      res.json(updated);
    } catch (error) {
      console.error("Reject booking error:", error);
      res.status(500).json({ message: "Failed to reject booking" });
    }
  });

  app.get("/api/admin/users", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const usersWithoutPasswords = allUsers.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Admin get users error:", error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  app.patch("/api/admin/users/:id/role", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { role } = req.body;

      if (!["student", "faculty", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const updated = await storage.updateUserRole(userId, role);
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = updated;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update user role error:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.delete("/api/admin/users/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (userId === req.user!.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      await storage.deleteUser(userId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Admin Facility Routes
  app.post("/api/admin/facilities", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const parsed = insertFacilitySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Validation failed", errors: parsed.error.errors });
      }

      const facility = await storage.createFacility(parsed.data);
      res.status(201).json(facility);
    } catch (error) {
      console.error("Create facility error:", error);
      res.status(500).json({ message: "Failed to create facility" });
    }
  });

  app.patch("/api/admin/facilities/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const facilityId = parseInt(req.params.id);
      const updated = await storage.updateFacility(facilityId, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Facility not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Update facility error:", error);
      res.status(500).json({ message: "Failed to update facility" });
    }
  });

  app.delete("/api/admin/facilities/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const facilityId = parseInt(req.params.id);
      await storage.deleteFacility(facilityId);
      res.json({ message: "Facility deleted successfully" });
    } catch (error) {
      console.error("Delete facility error:", error);
      res.status(500).json({ message: "Failed to delete facility" });
    }
  });

  // Admin Reports/Stats Routes
  app.get("/api/admin/stats", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const [bookingStats, allUsers, allFacilities] = await Promise.all([
        storage.getBookingStats(),
        storage.getAllUsers(),
        storage.getAllFacilities(),
      ]);

      res.json({
        bookings: bookingStats,
        users: {
          total: allUsers.length,
          students: allUsers.filter(u => u.role === "student").length,
          faculty: allUsers.filter(u => u.role === "faculty").length,
          admins: allUsers.filter(u => u.role === "admin").length,
        },
        facilities: {
          total: allFacilities.length,
          available: allFacilities.filter(f => f.status === "available").length,
          maintenance: allFacilities.filter(f => f.status === "maintenance").length,
          closed: allFacilities.filter(f => f.status === "closed").length,
        },
      });
    } catch (error) {
      console.error("Get admin stats error:", error);
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  return httpServer;
}
