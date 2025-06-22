const amqp = require('amqplib');
const ConsumerService = require('./ConsumerService');
const MailSender = require('./MailSender');

const init = async () => {
  const consumerService = new ConsumerService();
  const mailSender = new MailSender();

  const connection = await amqp.connect(process.env.RABBITMQ_SERVER);
  const channel = await connection.createChannel();

  await channel.assertQueue('export:playlist', {
    durable: true,
  });

  channel.consume('export:playlist', async (message) => {
    try {
      const { playlistId, targetEmail } = JSON.parse(message.content.toString());

      const playlist = await consumerService.getPlaylistById(playlistId);
      const result = await mailSender.sendEmail(targetEmail, JSON.stringify(playlist, null, 2));
      
      console.log(result);
      channel.ack(message);
    } catch (error) {
      console.error(error);
      channel.ack(message);
    }
  });
};

init();