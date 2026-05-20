// eLearning-platform/user-service/kafka/producer.js
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'user-service',
  brokers: [process.env.KAFKA_BROKER || '127.0.0.1:9092']
});

const producer = kafka.producer();
let isConnected = false;

(async () => {
  try {
    await producer.connect();
    isConnected = true;
    console.log('Kafka producer connected (user-service)');
  } catch (error) {
    console.warn('Kafka not available (user-service):', error.message);
  }
})();

async function publishUserRegistered(userId, email, name) {
  if (!isConnected) {
    console.warn('Kafka not connected, skipping user.registered');
    return;
  }
  try {
    await producer.send({
      topic: 'user.registered',
      messages: [{
        value: JSON.stringify({
          userId,
          email,
          name,
          timestamp: new Date().toISOString()
        })
      }]
    });
  } catch (error) {
    console.error('Failed to publish user.registered:', error.message);
  }
}

module.exports = { publishUserRegistered };
