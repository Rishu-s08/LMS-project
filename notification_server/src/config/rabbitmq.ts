import ampq from "amqplib";
import { env } from "./config.js";
import { logger } from "../shared/logger.js";

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

export async function consumeEvent(routingKey: string, callback: (event: any) => Promise<void>) {
    if (!channel) {
        await connectToRabbitMQ();
    }
    const queue = await channel!.assertQueue("", { exclusive: true });
    await channel!.bindQueue(queue.queue, EXCHANGE_NAME, routingKey);
    channel!.consume(queue.queue, async (msg) => {
        if (msg != null) {
            const content = JSON.parse(msg.content.toString());
            try {
                await callback(content);
                channel?.ack(msg);
                logger.info({ routingKey, content }, "Event processed");
            } catch (error) {
                logger.error({ err: error, routingKey, content }, "Event processing failed, requeuing");
                channel?.nack(msg, false, true);
            }
        }
    });
    logger.info({ routingKey, queue: queue.queue }, "Consumer bound");
}
