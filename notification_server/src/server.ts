import { connectToRabbitMQ, consumeEvent } from "./config/rabbitmq.js";
import { handleAssignmentCreatedEvent, handleResourceUploadedEvent, handleClassroomCreatedEvent } from "./eventHandlers/notification.eventHandler.js";
import { routingKeys } from "./shared/constants.js";


async function startServer() {
    try {
        await connectToRabbitMQ();
        console.log("Notification server started and connected to RabbitMQ.");

        await consumeEvent(routingKeys.assignmentCreated, handleAssignmentCreatedEvent);
        await consumeEvent(routingKeys.resourceCreated, handleResourceUploadedEvent);
        await consumeEvent(routingKeys.classroomCreated, handleClassroomCreatedEvent);

    } catch (error) {
        console.error("Error starting notification server:", error);
        process.exit(1);
    }
}

startServer();
