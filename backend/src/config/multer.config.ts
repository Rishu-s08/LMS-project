import multer,{ type FileFilterCallback, type StorageEngine } from 'multer';
import path from 'path';
import type { Request } from 'express';

// 1. Configure the custom disk storage engine with explicit types
// const storage: StorageEngine = multer.diskStorage({
//   destination: (
//     req: Request, 
//     file: Express.Multer.File, 
//     cb: (error: Error | null, destination: string) => void
//   ) => {
//     // Ensure this directory path exists in your project structure
//     cb(null, 'uploads/assignments/');
//   },
//   filename: (
//     req: Request, 
//     file: Express.Multer.File, 
//     cb: (error: Error | null, filename: string) => void
//   ) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     const fileExtension = path.extname(file.originalname).toLowerCase();
    
//     // Generates safe filename format: attachment-1718265000000-987654321.pdf
//     cb(null, `${file.fieldname}-${uniqueSuffix}${fileExtension}`);
//   }
// });

const storage: StorageEngine = multer.memoryStorage(); // Use memory storage for better performance and security

// 2. Strongly typed file criteria validator
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    // Pass true if file matches expected parameters
    cb(null, true);
  } else {
    // Return an operational error directly to the request cycle
    cb(new Error('Invalid file type. Only docs, PDFs, and images are allowed.'));
  }
};

// 3. Assemble and export the module instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // Strict 10MB individual file cap
  }
});

export default upload;
