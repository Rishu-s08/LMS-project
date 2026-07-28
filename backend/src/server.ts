import app from "./app.js";
import { connectToRabbitMQ } from "./config/rabbitmq.js";
import { logger } from "./shared/utils/logger.util.js";

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await connectToRabbitMQ();
        app.listen(PORT, () => {
            logger.info({ port: PORT, env: process.env.NODE_ENV || "development" }, "Server started");
        });
    } catch (error) {
        logger.fatal({ err: error }, "Failed to start server");
        process.exit(1);
    }
}

startServer();
