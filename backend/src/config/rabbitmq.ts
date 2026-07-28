import ampq from "amqplib";
import { env } from "./config.js";
import { logger } from "../shared/utils/logger.util.js";

let connection: any = null;
let channel: ampq.Channel | null = null;

const EXCHANGE_NAME = "notification_exchange";

export async function connectToRabbitMQ() {
    try {
        connection = await ampq.connect(env.AMQP_URL);
        channel = await connection.createChannel();
        await channel!.assertExchange(EXCHANGE_NAME, "topic", { durable: true });
        logger.info("RabbitMQ connected");
        return channel;
    } catch (error) {
        logger.error({ err: error }, "RabbitMQ connection failed");
        throw error;
    }
}

export async function publishEvent(routingKey: string, message: object) {
    if (!channel) {
        await connectToRabbitMQ();
    }
    channel!.publish(EXCHANGE_NAME, routingKey, Buffer.from(JSON.stringify(message)));
    logger.info({ routingKey }, "Event published to RabbitMQ");
}
