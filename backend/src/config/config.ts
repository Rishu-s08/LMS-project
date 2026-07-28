import dotenv from "dotenv";
import path from "path";

// Load .env from project root (one level up from backend/)
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
// Fallback: also check parent directory (for when cwd is backend/)
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

export const env = {
    DATABASE_URL: process.env.DATABASE_URL!,
    PORT: process.env.PORT || 3000,
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || "default_secret",
    ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY || '15m',
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || "default_refresh_secret",
    REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || '7d',
    SUPABASE_URL : process.env.SUPABASE_URL || 'https://supabase.co',
    SUPABASE_PUBLISHABLE_KEY : process.env.SUPABASE_PUBLISHABLE_KEY || 'your-key',
    SUPABASE_SECRET_KEY : process.env.SUPABASE_SECRET_KEY || 'your-secret-key',
    REDIS_URL : process.env.REDIS_URL || 'redis://localhost:6379',
    AMQP_URL : process.env.AMQP_URL || 'amqp://guest:guest@localhost:5672'
}