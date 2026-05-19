const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const { startConsuming, getStore } = require('./kafka/consumer');
const { 
  initializeDatabase, 
  getUserNotifications, 
  markNotificationAsRead 
} = require('./db/rxdb');

const PROTO_PATH = path.join(__dirname, '../proto/notification.proto');
const PORT = process.env.NOTIFICATION_SERVICE_PORT || '50053';

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true
});
const notificationProto = grpc.loadPackageDefinition(packageDef).notification;

const getNotifications = async (call, callback) => {
  const { user_id } = call.request;
  try {
    let userNotifs = [];
    
    // Fetch from RxDB first (primary source)
    if (user_id) {
      const rxdbNotifs = await getUserNotifications(user_id);
      userNotifs = rxdbNotifs.map(n => n.toJSON ? n.toJSON() : n);
    } else {
      // Fallback to in-memory store
      const store = getStore();
      userNotifs = store;
    }

    callback(null, {
      notifications: userNotifs.map(n => ({
        id: n.id, user_id: n.userId, type: n.type,
        message: n.message, read: n.read, created_at: n.createdAt
      })),
      status: 'SUCCESS'
    });
  } catch (error) {
    callback(null, { notifications: [], status: 'ERROR', message: error.message });
  }
};

const markAsRead = async (call, callback) => {
  const { notification_id } = call.request;
  try {
    await markNotificationAsRead(notification_id);
    callback(null, { status: 'SUCCESS', message: 'Notification marquée comme lue' });
  } catch (error) {
    callback(null, { status: 'ERROR', message: error.message });
  }
};

const start = async () => {
  try {
    // Initialize RxDB
    await initializeDatabase();
    
    // Start Kafka consumer
    
    
    const server = new grpc.Server();
    server.addService(notificationProto.NotificationService.service, {
      GetNotifications: getNotifications,
      MarkAsRead: markAsRead
    });
    server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
      if (err) { console.error('❌ Erreur:', err); process.exit(1); }
      console.log(`🚀 Notification Service démarré sur le port ${port}`);
    });
  } catch (error) {
    console.error('❌ Failed to start notification service:', error);
    process.exit(1);
  }
};

start();