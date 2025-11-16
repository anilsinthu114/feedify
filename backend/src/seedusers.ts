import bcrypt from "bcryptjs";
import { initDb } from "./db/drizzle";
import { users } from "./db/schema";

async function seedUsers() {
  const db = await initDb();

  // Hash passwords
  const hrPassword = await bcrypt.hash("HrP@ssw0rd", 10);
  const userPassword = await bcrypt.hash("UserP@ss123", 10);

  try {
    await db.insert(users).values([
      {
        name: "HR Admin",
        email: "hr@feedify.com",
        role: "hr",
        passwordHash: hrPassword,
      },
      {
        name: "John Doe",
        email: "user1@feedify.com",
        role: "user",
        passwordHash: userPassword,
      },
    ]);

    console.log("Dummy users added successfully!");
  } catch (err: any) {
    if (err.message.includes("UNIQUE constraint failed")) {
      console.log("Users already exist, skipping...");
    } else {
      console.error(err);
    }
  }
}

// Run the seed script
(async () => {
  await seedUsers();
})();
