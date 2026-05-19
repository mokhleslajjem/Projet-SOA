const { createRxDatabase } = require('rxdb');
const { getRxStorageMemory } = require('rxdb/plugins/storage-memory');

let db = null;

const notificationSchema = {
  title: 'Notification',
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 100
    },
    userId: {
      type: 'string',
      maxLength: 100
    },
    type: {
      type: 'string',
      maxLength: 50
    },
    message: {
      type: 'string',
      maxLength: 1000
    },
    read: {
      type: 'boolean'
    },
    createdAt: {
      type: 'string',
      maxLength: 50
    },
    updatedAt: {
      type: 'string',
      maxLength: 50
    }
  },
  required: ['id', 'userId', 'type', 'message', 'createdAt']
};

const initializeDatabase = async () => {
  if (db) return db;

  try {
    db = await createRxDatabase({
      name: 'notification_db',
      storage: getRxStorageMemory()
    });

    await db.addCollections({
      notifications: {
        schema: notificationSchema
      }
    });

    console.log('✅ RxDB NoSQL database initialized successfully');
    return db;
  } catch (error) {
    console.error('❌ Error initializing RxDB:', error.message);
    throw error;
  }
};

const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return db;
};

const getNotificationsCollection = () => {
  return getDatabase().collections.notifications;
};

// Add a new notification
const addNotification = async (notification) => {
  const collection = getNotificationsCollection();
  const notificationDoc = {
    id: notification.id,
    userId: notification.userId,
    type: notification.type,
    message: notification.message,
    read: notification.read || false,
    createdAt: notification.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    await collection.insert(notificationDoc);
    console.log(`📬 Notification added: ${notification.id}`);
    return notificationDoc;
  } catch (error) {
    console.error('Error adding notification:', error.message);
    throw error;
  }
};

// Get all notifications for a user
const getUserNotifications = async (userId) => {
  const collection = getNotificationsCollection();
  try {
    const notifications = await collection.find({ selector: { userId } }).exec();
    return notifications.map(n => n.toJSON ? n.toJSON() : n);
  } catch (error) {
    console.error('Error fetching user notifications:', error.message);
    return [];
  }
};

// Get unread notifications for a user
const getUnreadNotifications = async (userId) => {
  const collection = getNotificationsCollection();
  try {
    const notifications = await collection.find({
      selector: { userId, read: false }
    }).exec();
    return notifications.map(n => n.toJSON ? n.toJSON() : n);
  } catch (error) {
    console.error('Error fetching unread notifications:', error.message);
    return [];
  }
};

// Mark notification as read
const markNotificationAsRead = async (notificationId) => {
  const collection = getNotificationsCollection();
  try {
    const doc = await collection.findByIds([notificationId]);
    if (!doc || doc.size === 0) {
      throw new Error('Notification not found');
    }

    const notification = doc.get(notificationId);
    await notification.update({
      $set: {
        read: true,
        updatedAt: new Date().toISOString()
      }
    });

    console.log(`✅ Notification marked as read: ${notificationId}`);
    return notification.toJSON ? notification.toJSON() : notification;
  } catch (error) {
    console.error('Error marking notification as read:', error.message);
    throw error;
  }
};

// Mark all user notifications as read
const markAllUserNotificationsAsRead = async (userId) => {
  const collection = getNotificationsCollection();
  try {
    const notifications = await collection.find({ selector: { userId, read: false } }).exec();
    const updatePromises = notifications.map(doc =>
      doc.update({
        $set: {
          read: true,
          updatedAt: new Date().toISOString()
        }
      })
    );
    await Promise.all(updatePromises);
    console.log(`✅ All notifications marked as read for user: ${userId}`);
    return notifications.length;
  } catch (error) {
    console.error('Error marking all notifications as read:', error.message);
    throw error;
  }
};

// Delete notification
const deleteNotification = async (notificationId) => {
  const collection = getNotificationsCollection();
  try {
    const doc = await collection.findByIds([notificationId]);
    if (!doc || doc.size === 0) {
      throw new Error('Notification not found');
    }

    const notification = doc.get(notificationId);
    await notification.remove();

    console.log(`🗑️  Notification deleted: ${notificationId}`);
    return true;
  } catch (error) {
    console.error('Error deleting notification:', error.message);
    throw error;
  }
};

// Get all notifications (for debugging/admin)
const getAllNotifications = async () => {
  const collection = getNotificationsCollection();
  try {
    const notifications = await collection.find().exec();
    return notifications.map(n => n.toJSON ? n.toJSON() : n);
  } catch (error) {
    console.error('Error fetching all notifications:', error.message);
    return [];
  }
};

module.exports = {
  initializeDatabase,
  getDatabase,
  getNotificationsCollection,
  addNotification,
  getUserNotifications,
  getUnreadNotifications,
  markNotificationAsRead,
  markAllUserNotificationsAsRead,
  deleteNotification,
  getAllNotifications
};
