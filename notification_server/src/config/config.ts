import dotenv from "dotenv";
import path from "path";

// Load .env from cwd first, then parent (root of project)
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

export const env = {
    AMQP_URL: process.env.AMQP_URL || "amqp://guest:guest@localhost:5672",
    DATABASE_URL: process.env.DATABASE_URL!,
    REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
}
