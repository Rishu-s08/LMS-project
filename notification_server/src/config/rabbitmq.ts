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

// export async function publishEvent(routingKey: string, message: string) {
//     if (!channel) {
//         await connectToRabbitMQ();
//     }
//     channel!.publish(EXCHANGE_NAME, routingKey, Buffer.from(JSON.stringify(message)));
// }

export async function consumeEvent(routingKey: string, callback: (msg: ampq.ConsumeMessage | null) => void) {
    if (!channel) {
        await connectToRabbitMQ();
    }
    const queue = await channel!.assertQueue("", { exclusive: true });
    await channel!.bindQueue(queue.queue, EXCHANGE_NAME, routingKey);
    channel!.consume(queue.queue, (msg) => {
        if (msg != null) {
            try {
                const content = JSON.parse(msg.content.toString());
                callback(content);
                channel?.ack(msg);       
            } catch (error) {
                channel?.nack(msg, false, true); 
            }
        }
    });
}
