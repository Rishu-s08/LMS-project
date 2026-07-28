import { connectToRabbitMQ, consumeEvent } from "./config/rabbitmq.js";
import { handleAssignmentCreatedEvent, handleResourceUploadedEvent, handleClassroomCreatedEvent, handleAnnouncementCreatedEvent } from "./eventHandlers/notification.eventHandler.js";
import { routingKeys } from "./shared/constants.js";
import { logger } from "./shared/logger.js";


async function startServer() {
    try {
        await connectToRabbitMQ();

        await consumeEvent(routingKeys.assignmentCreated, handleAssignmentCreatedEvent);
        await consumeEvent(routingKeys.resourceCreated, handleResourceUploadedEvent);
        await consumeEvent(routingKeys.classroomCreated, handleClassroomCreatedEvent);
        await consumeEvent(routingKeys.announcementCreated, handleAnnouncementCreatedEvent);

        logger.info("Notification server started, listening for events");
    } catch (error) {
        logger.fatal({ err: error }, "Failed to start notification server");
        process.exit(1);
    }
}

startServer();
