import "dotenv/config";
import bcrypt from "bcrypt";
import { db } from "../server/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const email = "admin@gmail.com";
  const password = "admin123";
  const hash = await bcrypt.hash(password, 10);

  const [existing] = await db.select().from(users).where(eq(users.email, email));

  if (existing) {
    await db
      .update(users)
      .set({
        password: hash,
        role: "admin",
        firstName: existing.firstName ?? "Admin",
        lastName: existing.lastName ?? "User",
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id));
    console.log(`Updated existing user ${email} as admin.`);
  } else {
    const [inserted] = await db
      .insert(users)
      .values({
        email,
        password: hash,
        firstName: "Admin",
        lastName: "User",
        role: "admin",
      })
      .returning();
    console.log(`Created admin user ${inserted.email}.`);
  }

  console.log("Login with admin@gmail.com / admin123");
}

main()
  .catch((err) => {
    console.error("Admin seed failed", err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
