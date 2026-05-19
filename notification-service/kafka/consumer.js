const { Kafka } = require('kafkajs');
const { v4: uuidv4 } = require('uuid');
const { addNotification } = require('../db/rxdb');

const kafka = new Kafka({
  clientId: 'notification-service',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
  retry: { initialRetryTime: 300, retries: 5 }
});

const consumer = kafka.consumer({ groupId: 'notification-group' });
const notificationsStore = [];

const getStore = () => notificationsStore;

const startConsuming = async () => {
  try {
    await consumer.connect();
    console.log('✅ Kafka consumer connected (notification-service)');

    await consumer.subscribe({
      topics: ['user.registered', 'course.enrolled'],
      fromBeginning: true
    });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const data = JSON.parse(message.value.toString());
        console.log(`📩 Event reçu [${topic}]:`, data);

        let notification = null;

        if (topic === 'user.registered') {
          notification = {
            id: uuidv4(),
            userId: data.userId,
            type: 'INFO',
            message: `Bienvenue ${data.name} ! Votre compte a été créé.`,
            read: false,
            createdAt: new Date().toISOString()
          };
        }

        if (topic === 'course.enrolled') {
          notification = {
            id: uuidv4(),
            userId: data.userId,
            type: 'SUCCESS',
            message: `Vous êtes inscrit au cours "${data.courseTitle}" !`,
            read: false,
            createdAt: new Date().toISOString()
          };
        }

        if (notification) {
          notificationsStore.push(notification);
          // Store in RxDB for persistence and real-time capabilities
          try {
            await addNotification(notification);
          } catch (error) {
            console.error('Error saving notification to RxDB:', error.message);
          }
          console.log(`🔔 Notification créée:`, notification.message);
        }
      }
    });
  } catch (error) {
    console.warn('⚠️  Kafka consumer non disponible:', error.message);
  }
};

module.exports = { startConsuming, getStore };