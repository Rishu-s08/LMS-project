import ampq from "amqplib";
import { env } from "./config.js";

let connection = null;
let channel: ampq.Channel | null = null;

const EXCHANGE_NAME = "notification_exchange";

export async function connectToRabbitMQ() {
    try {
        connection = await ampq.connect(env.AMQP_URL);
        channel = await connection.createChannel();
        await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });
        console.log("✅ Connected to RabbitMQ");
        return channel;
    } catch (error) {
        console.error("❌ Error connecting to RabbitMQ:", error);
        throw error;
    }
}

export async function publishEvent(routingKey: string, message: object) {
    if (!channel) {
        await connectToRabbitMQ();
    }
    channel!.publish(EXCHANGE_NAME, routingKey, Buffer.from(JSON.stringify(message)));
}

