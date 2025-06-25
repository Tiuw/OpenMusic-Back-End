// filepath: d:\Ngoding\BackEnd\Fund-BE-js\submission-proyek-1\src\services\rabbitmq\ProducerService.js
const amqp = require('amqplib');

const ProducerService = {
  sendMessage: async (queue, message) => {
    // Parse the URL similar to how it's done in consumer.js
    const url = new URL(process.env.RABBITMQ_SERVER);

    // Create connection with explicit parameters including frameMax
    const connection = await amqp.connect({
      protocol: url.protocol.replace(':', ''),
      hostname: url.hostname,
      port: parseInt(url.port || 5672),
      username: url.username,
      password: url.password,
      frameMax: 131072, // Match the value in consumer.js
    });

    const channel = await connection.createChannel();

    await channel.assertQueue(queue, {
      durable: true,
    });

    await channel.sendToQueue(queue, Buffer.from(message));

    await connection.close();
  },
};

module.exports = ProducerService;
