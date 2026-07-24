import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import bcrypt from "bcrypt";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// ─── Shared password for all demo accounts ─────────────────────────────────
const DEMO_PASSWORD = await bcrypt.hash("password123", 10);

async function main() {
  console.log("🌱 Seeding database...\n");

  // ─── 1. USERS ─────────────────────────────────────────────────────────────

  // Admin
  const admin = await prisma.user.create({
    data: {
      email: "admin@lms.com",
      password: DEMO_PASSWORD,
      name: "Admin User",
      role: "ADMIN",
      isActive: true,
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  // Faculty
  const faculty1 = await prisma.user.create({
    data: {
      email: "john.doe@lms.com",
      password: DEMO_PASSWORD,
      name: "Dr. John Doe",
      role: "FACULTY",
      isActive: true,
    },
  });

  const faculty2 = await prisma.user.create({
    data: {
      email: "jane.smith@lms.com",
      password: DEMO_PASSWORD,
      name: "Prof. Jane Smith",
      role: "FACULTY",
      isActive: true,
    },
  });
  console.log(`✅ Faculty: ${faculty1.email}, ${faculty2.email}`);

  // Students
  const students = await Promise.all(
    [
      { email: "alice@lms.com", name: "Alice Johnson", branch: "CSE", batch: "2023-27", sem: 3 },
      { email: "bob@lms.com", name: "Bob Williams", branch: "CSE", batch: "2023-27", sem: 3 },
      { email: "charlie@lms.com", name: "Charlie Brown", branch: "CSE", batch: "2023-27", sem: 3 },
      { email: "diana@lms.com", name: "Diana Prince", branch: "ECE", batch: "2023-27", sem: 3 },
      { email: "eve@lms.com", name: "Eve Martinez", branch: "ECE", batch: "2023-27", sem: 3 },
      { email: "frank@lms.com", name: "Frank Castle", branch: "ME", batch: "2024-28", sem: 1 },
      { email: "grace@lms.com", name: "Grace Hopper", branch: "CSE", batch: "2024-28", sem: 1 },
      { email: "henry@lms.com", name: "Henry Ford", branch: "ME", batch: "2024-28", sem: 1 },
    ].map((s) =>
      prisma.user.create({
        data: {
          email: s.email,
          password: DEMO_PASSWORD,
          name: s.name,
          role: "STUDENT",
          branch: s.branch,
          batch: s.batch,
          sem: s.sem,
          isActive: true,
        },
      })
    )
  );
  console.log(`✅ Students: ${students.length} created`);

  // ─── 2. COURSES ───────────────────────────────────────────────────────────

  const courses = await Promise.all([
    prisma.courses.create({
      data: { name: "Data Structures & Algorithms", code: "CS201", credits: 4, description: "Fundamental data structures and algorithm design techniques" },
    }),
    prisma.courses.create({
      data: { name: "Database Management Systems", code: "CS301", credits: 4, description: "Relational databases, SQL, normalization, and transactions" },
    }),
    prisma.courses.create({
      data: { name: "Operating Systems", code: "CS302", credits: 3, description: "Process management, memory, file systems, and concurrency" },
    }),
    prisma.courses.create({
      data: { name: "Digital Electronics", code: "EC201", credits: 3, description: "Logic gates, combinational and sequential circuits" },
    }),
    prisma.courses.create({
      data: { name: "Engineering Mathematics III", code: "MA201", credits: 4, description: "Probability, statistics, and linear algebra" },
    }),
  ]);
  console.log(`✅ Courses: ${courses.length} created`);

  // ─── 3. CLASSES ───────────────────────────────────────────────────────────

  const [dsa, dbms, os, digitalElec, maths] = courses;

  const classes = await Promise.all([
    // Dr. John Doe teaches DSA and DBMS to CSE 3rd sem
    prisma.classes.create({
      data: {
        courseId: dsa!.courseId,
        facultyId: faculty1.userId,
        semester: 3,
        year: 2,
        branch: "CSE",
        academicYear: "2025-2026",
      },
    }),
    prisma.classes.create({
      data: {
        courseId: dbms!.courseId,
        facultyId: faculty1.userId,
        semester: 3,
        year: 2,
        branch: "CSE",
        academicYear: "2025-2026",
      },
    }),
    // Prof. Jane Smith teaches OS to CSE and Digital Electronics to ECE
    prisma.classes.create({
      data: {
        courseId: os!.courseId,
        facultyId: faculty2.userId,
        semester: 3,
        year: 2,
        branch: "CSE",
        academicYear: "2025-2026",
      },
    }),
    prisma.classes.create({
      data: {
        courseId: digitalElec!.courseId,
        facultyId: faculty2.userId,
        semester: 3,
        year: 2,
        branch: "ECE",
        academicYear: "2025-2026",
      },
    }),
    // Maths for 1st sem ME (Dr. John Doe)
    prisma.classes.create({
      data: {
        courseId: maths!.courseId,
        facultyId: faculty1.userId,
        semester: 1,
        year: 1,
        branch: "ME",
        academicYear: "2025-2026",
      },
    }),
  ]);
  console.log(`✅ Classes: ${classes.length} created`);

  const [dsaClass, dbmsClass, osClass, elecClass, mathsClass] = classes;

  // ─── 4. ENROLLMENTS ───────────────────────────────────────────────────────

  // CSE 3rd sem students → DSA, DBMS, OS
  const cseStudents = students.filter((s) => s.branch === "CSE" && s.sem === 3); // Alice, Bob, Charlie
  const eceStudents = students.filter((s) => s.branch === "ECE"); // Diana, Eve
  const meStudents = students.filter((s) => s.branch === "ME"); // Frank, Henry

  const enrollments: Promise<any>[] = [];

  for (const student of cseStudents) {
    enrollments.push(
      prisma.enrollment.create({ data: { classId: dsaClass!.classId, studentId: student.userId } }),
      prisma.enrollment.create({ data: { classId: dbmsClass!.classId, studentId: student.userId } }),
      prisma.enrollment.create({ data: { classId: osClass!.classId, studentId: student.userId } })
    );
  }

  for (const student of eceStudents) {
    enrollments.push(
      prisma.enrollment.create({ data: { classId: elecClass!.classId, studentId: student.userId } })
    );
  }

  for (const student of meStudents) {
    enrollments.push(
      prisma.enrollment.create({ data: { classId: mathsClass!.classId, studentId: student.userId } })
    );
  }

  // Grace (CSE 1st sem) enrolls in Maths too
  const grace = students.find((s) => s.email === "grace@lms.com")!;
  enrollments.push(
    prisma.enrollment.create({ data: { classId: mathsClass!.classId, studentId: grace.userId } })
  );

  await Promise.all(enrollments);
  console.log(`✅ Enrollments: ${enrollments.length} created`);

  // ─── 5. ASSIGNMENTS ───────────────────────────────────────────────────────

  const now = new Date();
  const inOneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const inTwoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

  const assignments = await Promise.all([
    prisma.assignment.create({
      data: {
        title: "Implement Binary Search Tree",
        description: "Implement BST with insert, delete, search, and traversal operations. Submit code + analysis.",
        dueDate: inOneWeek,
        classId: dsaClass!.classId,
        isPublished: true,
        attachmentUrl: "https://gytpoyuiousykgkpemop.supabase.co/storage/v1/object/public/assignments/assignments/assignments-1784717692231-82057124.pdf",
      },
    }),
    prisma.assignment.create({
      data: {
        title: "Array Sorting Comparison",
        description: "Compare time complexity of Merge Sort, Quick Sort, and Heap Sort with benchmarks.",
        dueDate: inTwoWeeks,
        classId: dsaClass!.classId,
        isPublished: true,
      },
    }),
    prisma.assignment.create({
      data: {
        title: "ER Diagram for Library System",
        description: "Design a complete ER diagram for a university library management system.",
        dueDate: inOneWeek,
        classId: dbmsClass!.classId,
        isPublished: true,
      },
    }),
    prisma.assignment.create({
      data: {
        title: "SQL Query Practice",
        description: "Solve the 15 SQL queries provided in the attached PDF.",
        dueDate: inTwoWeeks,
        classId: dbmsClass!.classId,
        isPublished: false, // Draft — not visible to students yet
      },
    }),
    prisma.assignment.create({
      data: {
        title: "Process Scheduling Simulation",
        description: "Simulate FCFS, SJF, and Round Robin scheduling algorithms.",
        dueDate: inOneWeek,
        classId: osClass!.classId,
        isPublished: true,
      },
    }),
    // Past deadline assignment (for testing deadline enforcement)
    prisma.assignment.create({
      data: {
        title: "Intro to Logic Gates",
        description: "Solve the truth table exercises from Chapter 1.",
        dueDate: yesterday,
        classId: elecClass!.classId,
        isPublished: true,
      },
    }),
  ]);
  console.log(`✅ Assignments: ${assignments.length} created`);

  // ─── 6. SUBMISSIONS ───────────────────────────────────────────────────────

  const [bstAssignment, sortAssignment] = assignments;
  const alice = cseStudents[0]!;
  const bob = cseStudents[1]!;

  await Promise.all([
    prisma.submission.create({
      data: {
        assignmentId: bstAssignment!.assignmentId,
        studentId: alice.userId,
        note: "Implemented in TypeScript with unit tests.",
        attachmentUrl: "https://gytpoyuiousykgkpemop.supabase.co/storage/v1/object/public/submissions/submissions/Screenshot_1778767500.png",
      },
    }),
    prisma.submission.create({
      data: {
        assignmentId: bstAssignment!.assignmentId,
        studentId: bob.userId,
        note: "Implemented in Python. Attached Jupyter notebook.",
        attachmentUrl: "https://gytpoyuiousykgkpemop.supabase.co/storage/v1/object/public/submissions/submissions/Screenshot_1778768373.png",
      },
    }),
  ]);
  console.log(`✅ Submissions: 2 created (Alice & Bob for BST assignment)`);

  // ─── 7. RESOURCES ─────────────────────────────────────────────────────────

  await Promise.all([
    prisma.resource.create({
      data: {
        title: "DSA Lecture Notes - Week 1",
        description: "Introduction to complexity analysis and Big-O notation.",
        classId: dsaClass!.classId,
        attachmentUrl: "https://gytpoyuiousykgkpemop.supabase.co/storage/v1/object/public/resources/resources/resources-1784718732465-165190005.pdf",
      },
    }),
    prisma.resource.create({
      data: {
        title: "DSA Lecture Notes - Week 2",
        description: "Arrays, Linked Lists, Stacks, and Queues.",
        classId: dsaClass!.classId,
      },
    }),
    prisma.resource.create({
      data: {
        title: "DBMS Textbook Reference",
        description: "Chapters 1-5 from Korth & Silberschatz for midterm preparation.",
        classId: dbmsClass!.classId,
        attachmentUrl: "https://gytpoyuiousykgkpemop.supabase.co/storage/v1/object/public/resources/resources/resources-1784718732465-165190005.pdf",
      },
    }),
    prisma.resource.create({
      data: {
        title: "OS Lab Manual",
        description: "Lab exercises for process and thread management.",
        classId: osClass!.classId,
      },
    }),
  ]);
  console.log(`✅ Resources: 4 created`);

  // ─── 8. ANNOUNCEMENTS ─────────────────────────────────────────────────────

  await Promise.all([
    prisma.announcement.create({
      data: {
        title: "Mid-Semester Exam Schedule",
        content: "DSA mid-semester exam is on August 15, 2026. Syllabus: Chapters 1-6. Bring your ID cards.",
        classId: dsaClass!.classId,
      },
    }),
    prisma.announcement.create({
      data: {
        title: "Lab Timing Change",
        content: "DBMS lab on Fridays is moved from 2pm to 4pm starting next week. Room: CS-204.",
        classId: dbmsClass!.classId,
      },
    }),
    prisma.announcement.create({
      data: {
        title: "Guest Lecture",
        content: "We have a guest lecture on Linux Kernel Internals this Thursday at 11am in the auditorium.",
        classId: osClass!.classId,
      },
    }),
    prisma.announcement.create({
      data: {
        title: "Assignment Deadline Extended",
        content: "The Logic Gates assignment deadline has been extended by 2 days due to the holiday.",
        classId: elecClass!.classId,
      },
    }),
  ]);
  console.log(`✅ Announcements: 4 created`);

  // ─── SUMMARY ──────────────────────────────────────────────────────────────

  console.log("\n" + "═".repeat(50));
  console.log("🎉 Seed complete! Demo accounts:");
  console.log("═".repeat(50));
  console.log(`\n  All passwords: password123\n`);
  console.log("  ADMIN:   admin@lms.com");
  console.log("  FACULTY: john.doe@lms.com, jane.smith@lms.com");
  console.log("  STUDENTS:");
  console.log("    CSE 3rd sem: alice@lms.com, bob@lms.com, charlie@lms.com");
  console.log("    ECE 3rd sem: diana@lms.com, eve@lms.com");
  console.log("    ME  1st sem: frank@lms.com, henry@lms.com");
  console.log("    CSE 1st sem: grace@lms.com");
  console.log("\n" + "═".repeat(50));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
