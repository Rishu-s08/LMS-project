import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function reset() {
  console.log("🗑️  Clearing all data...\n");

  // Delete in reverse dependency order to avoid FK constraint errors
  await prisma.submission.deleteMany();
  console.log("  ✓ Submissions cleared");

  await prisma.announcement.deleteMany();
  console.log("  ✓ Announcements cleared");

  await prisma.resource.deleteMany();
  console.log("  ✓ Resources cleared");

  await prisma.assignment.deleteMany();
  console.log("  ✓ Assignments cleared");

  await prisma.enrollment.deleteMany();
  console.log("  ✓ Enrollments cleared");

  await prisma.classes.deleteMany();
  console.log("  ✓ Classes cleared");

  await prisma.courses.deleteMany();
  console.log("  ✓ Courses cleared");

  await prisma.passwordResetToken.deleteMany();
  console.log("  ✓ Password reset tokens cleared");

  await prisma.refreshToken.deleteMany();
  console.log("  ✓ Refresh tokens cleared");

  await prisma.user.deleteMany();
  console.log("  ✓ Users cleared");

  console.log("\n✅ Database reset complete. Run `npm run seed` to repopulate.");
}

reset()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Reset failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
