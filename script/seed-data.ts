import "dotenv/config";
import bcrypt from "bcrypt";
import { db } from "../server/db";
import { users, facilities, bookings, notifications } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Starting database seeding...\n");

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log("Clearing existing data...");
  await db.delete(notifications);
  await db.delete(bookings);
  await db.delete(facilities);
  await db.delete(users);
  console.log("✓ Cleared existing data\n");

  // Seed Users
  console.log("Seeding users...");
  const adminHash = await bcrypt.hash("admin123", 10);
  const studentHash = await bcrypt.hash("student123", 10);
  const facultyHash = await bcrypt.hash("faculty123", 10);

  const [admin, student1, student2, faculty1, faculty2] = await db.insert(users).values([
    {
      email: "admin@gmail.com",
      password: adminHash,
      firstName: "Admin",
      lastName: "User",
      role: "admin",
    },
    {
      email: "john.doe@student.edu",
      password: studentHash,
      firstName: "John",
      lastName: "Doe",
      studentId: "STU001",
      role: "student",
    },
    {
      email: "jane.smith@student.edu",
      password: studentHash,
      firstName: "Jane",
      lastName: "Smith",
      studentId: "STU002",
      role: "student",
    },
    {
      email: "prof.brown@faculty.edu",
      password: facultyHash,
      firstName: "Robert",
      lastName: "Brown",
      studentId: "FAC001",
      role: "faculty",
    },
    {
      email: "prof.wilson@faculty.edu",
      password: facultyHash,
      firstName: "Sarah",
      lastName: "Wilson",
      studentId: "FAC002",
      role: "faculty",
    },
  ]).returning();

  console.log("✓ Created 5 users (1 admin, 2 students, 2 faculty)\n");

  // Seed Facilities
  console.log("Seeding facilities...");
  const [auditorium, lab, conference, gym, library, cafeteria] = await db.insert(facilities).values([
    {
      name: "Main Auditorium",
      description: "Large venue for conferences, seminars, and major events with professional audio-visual equipment",
      capacity: 500,
      location: "Building A, Ground Floor",
      status: "available",
      amenities: "Projector, Sound System, Stage, AC, Microphones, Recording Equipment",
    },
    {
      name: "Computer Lab 101",
      description: "State-of-the-art computer laboratory with high-performance workstations",
      capacity: 40,
      location: "Building B, 1st Floor",
      status: "available",
      amenities: "50 Desktop Computers, Whiteboard, Projector, AC, High-Speed Internet",
    },
    {
      name: "Conference Room A",
      description: "Professional meeting space for smaller gatherings and presentations",
      capacity: 25,
      location: "Administration Building, 2nd Floor",
      status: "available",
      amenities: "Conference Table, Projector, Whiteboard, Video Conferencing, AC",
    },
    {
      name: "Sports Complex Gymnasium",
      description: "Multi-purpose indoor sports facility for athletic events and activities",
      capacity: 200,
      location: "Sports Complex",
      status: "available",
      amenities: "Basketball Court, Volleyball Court, Seating, Lockers, Restrooms",
    },
    {
      name: "Study Hall & Library",
      description: "Quiet study space with extensive book collection and research resources",
      capacity: 150,
      location: "Library Building, 1st Floor",
      status: "maintenance",
      amenities: "Reading Tables, Bookshelves, WiFi, Silent Study Zones, Computers",
    },
    {
      name: "Outdoor Amphitheater",
      description: "Open-air venue perfect for outdoor events, performances, and gatherings",
      capacity: 300,
      location: "Campus Courtyard",
      status: "available",
      amenities: "Stage, Seating, Sound System, Lighting, Covered Stage Area",
    },
  ]).returning();

  console.log("✓ Created 6 facilities\n");

  // Seed Bookings
  console.log("Seeding bookings...");
  const [booking1, booking2, booking3, booking4, booking5] = await db.insert(bookings).values([
    {
      userId: student1.id,
      facilityId: auditorium.id,
      eventName: "Tech Conference 2025",
      eventDescription: "Annual technology conference featuring industry speakers and workshops",
      purpose: "Educational seminar for Computer Science students",
      eventDate: "2025-01-15",
      startTime: "09:00",
      endTime: "17:00",
      attendees: 350,
      equipmentNeeded: "Extra microphones, laptop connectors",
      status: "approved",
      adminNotes: "Approved - all requirements can be accommodated",
      reviewedBy: admin.id,
      reviewedAt: new Date(),
    },
    {
      userId: student2.id,
      facilityId: conference.id,
      eventName: "Student Council Meeting",
      eventDescription: "Monthly student council planning and discussion session",
      purpose: "Administrative meeting",
      eventDate: "2025-12-20",
      startTime: "14:00",
      endTime: "16:00",
      attendees: 20,
      status: "pending",
    },
    {
      userId: faculty1.id,
      facilityId: lab.id,
      eventName: "Programming Workshop",
      eventDescription: "Hands-on coding workshop for advanced Python programming",
      purpose: "Educational workshop",
      eventDate: "2025-12-18",
      startTime: "10:00",
      endTime: "15:00",
      attendees: 35,
      equipmentNeeded: "Programming software licenses",
      status: "approved",
      adminNotes: "All software pre-installed",
      reviewedBy: admin.id,
      reviewedAt: new Date(),
    },
    {
      userId: faculty2.id,
      facilityId: gym.id,
      eventName: "Faculty Basketball Tournament",
      eventDescription: "Annual inter-department basketball competition",
      purpose: "Sports event",
      eventDate: "2025-12-25",
      startTime: "16:00",
      endTime: "20:00",
      attendees: 100,
      status: "pending",
    },
    {
      userId: student1.id,
      facilityId: auditorium.id,
      eventName: "Cultural Night 2025",
      eventDescription: "Showcase of diverse cultural performances and activities",
      purpose: "Cultural event",
      eventDate: "2025-12-30",
      startTime: "18:00",
      endTime: "22:00",
      attendees: 400,
      equipmentNeeded: "Stage lighting, extra seating",
      status: "rejected",
      adminNotes: "Date conflicts with another major event",
      reviewedBy: admin.id,
      reviewedAt: new Date(),
    },
  ]).returning();

  console.log("✓ Created 5 bookings (2 approved, 2 pending, 1 rejected)\n");

  // Seed Notifications
  console.log("Seeding notifications...");
  await db.insert(notifications).values([
    {
      userId: student1.id,
      title: "Booking Approved",
      message: "Your booking request for 'Tech Conference 2025' at Main Auditorium has been approved.",
      type: "success",
      relatedBookingId: booking1.id,
      status: "read",
    },
    {
      userId: student1.id,
      title: "Booking Rejected",
      message: "Your booking request for 'Cultural Night 2025' has been rejected. Reason: Date conflicts with another major event",
      type: "error",
      relatedBookingId: booking5.id,
      status: "unread",
    },
    {
      userId: student2.id,
      title: "Booking Pending",
      message: "Your booking request for 'Student Council Meeting' is pending review.",
      type: "info",
      relatedBookingId: booking2.id,
      status: "unread",
    },
    {
      userId: faculty1.id,
      title: "Booking Approved",
      message: "Your booking request for 'Programming Workshop' at Computer Lab 101 has been approved.",
      type: "success",
      relatedBookingId: booking3.id,
      status: "read",
    },
    {
      userId: faculty2.id,
      title: "Booking Pending",
      message: "Your booking request for 'Faculty Basketball Tournament' is under review.",
      type: "info",
      relatedBookingId: booking4.id,
      status: "unread",
    },
  ]);

  console.log("✓ Created 5 notifications\n");

  console.log("=====================================");
  console.log("Database seeding completed successfully!");
  console.log("=====================================\n");
  console.log("Login Credentials:");
  console.log("------------------");
  console.log("Admin:    admin@gmail.com / admin123");
  console.log("Student:  john.doe@student.edu / student123");
  console.log("Student:  jane.smith@student.edu / student123");
  console.log("Faculty:  prof.brown@faculty.edu / faculty123");
  console.log("Faculty:  prof.wilson@faculty.edu / faculty123");
  console.log("\nAccess the application at http://localhost:5000");
}

main()
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
