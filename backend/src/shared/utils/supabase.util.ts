import path from "path";
import { createClient } from "@supabase/supabase-js/dist/index.cjs";
import { ApiError } from "../errors/api_error.js";
import { env } from "../../config/config.js";

const SUPABASE_URL = env.SUPABASE_URL || 'https://supabase.co';
const SUPABASE_KEY = env.SUPABASE_SECRET_KEY || 'your-key';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const uploadToCloud = async (file: Express.Multer.File, bucketName: string): Promise<string> => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const fileExtension = path.extname(file.originalname).toLowerCase();
        const fileName = `${bucketName}-${uniqueSuffix}${fileExtension}`;

        const { data, error } = await supabase.storage
            .from(bucketName) // Targets your public bucket name inside Supabase Dashboard
            .upload(`${bucketName}/${fileName}`, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });

        if (error) {
            throw new ApiError(500, `Cloud upload failed: ${error.message}`);
        }

        const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(`${bucketName}/${fileName}`);
        console.log("Supabase public URL response:", urlData);
        return urlData.publicUrl;
    }


export const deleteFromCloud = async (fullUrl: string, bucketName: string): Promise<void> => {
    const pathParts = fullUrl.split(`/public/${bucketName}/`);
    
    if (pathParts.length < 2) {
        throw new ApiError(400, "Invalid Supabase storage URL format.");
    }
    
    const relativeFilePath = pathParts[1];

    // console.log("Extracted relative path for deletion:", relativeFilePath);

    const { error } = await supabase.storage
        .from(bucketName)
        .remove([relativeFilePath as string]);

    // console.log("Supabase deletion response error:", error);

    if (error) {
        throw new ApiError(500, `Cloud deletion failed: ${error.message}`);
    }
};