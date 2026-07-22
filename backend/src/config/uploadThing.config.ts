import { createUploadthing, type FileRouter } from "uploadthing/server";

const f = createUploadthing();

// Define your File Router
export const uploadRouter = {
  // Define a route name: assignmentAttachment
  assignmentAttachment: f({
    pdf: { maxFileSize: "32MB" },
    blob: { maxFileSize: "32MB" }, // Allows general documents/docs
    image: { maxFileSize: "4MB" },
  })
    // This middleware runs on your server BEFORE the file is uploaded
    .middleware(async ({ req }) => {
      // You can validate user auth sessions here if needed
      return { userId: "server_processed" };
    })
    // Runs after the file is successfully uploaded to the cloud
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL available at:", file.url); // Safe cloud hosted URL
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;