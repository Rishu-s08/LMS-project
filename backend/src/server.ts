import app from "./app.js";
import { connectToRabbitMQ } from "./config/rabbitmq.js";

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await connectToRabbitMQ();     
        app.listen(PORT, () => {
          console.log(`Server is running on port ${PORT}`);
          console.log(`Visit http://localhost:${PORT} to access the application.`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

startServer();

