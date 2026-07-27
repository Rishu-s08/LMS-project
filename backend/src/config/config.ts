import "dotenv/config";
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
    REDIS_URL : process.env.REDIS_URL || 'redis://localhost:6379'
}