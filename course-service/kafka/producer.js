const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'course-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
  retry: { initialRetryTime: 300, retries: 5 }
});

const producer = kafka.producer();
let isConnected = false;

const connect = async () => {
  try {
    await producer.connect();
    isConnected = true;
    console.log('✅ Kafka producer connected (course-service)');
  } catch (error) {
    console.warn('⚠️  Kafka not available:', error.message);
  }
};

const publishEvent = async (topic, message) => {
  if (!isConnected) {
    console.warn(`⚠️  Kafka not connected, skipping: ${topic}`);
    return;
  }
  try {
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }]
    });
    console.log(`📤 Event published [${topic}]:`, message);
  } catch (error) {
    console.error('❌ Failed to publish:', error.message);
  }
};

module.exports = { connect, publishEvent };