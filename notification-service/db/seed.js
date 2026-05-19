const { createRxDatabase } = require('rxdb');
const { getRxStorageMemory } = require('rxdb/plugins/storage-memory');

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

async function seedNotifications() {
  try {
    const db = await createRxDatabase({
      name: 'notification_db_seed',
      storage: getRxStorageMemory()
    });

    const notificationCollection = await db.addCollections({
      notifications: {
        schema: notificationSchema
      }
    });

    const notifications = [
      {
        id: 'notif-1',
        userId: 'user-1',
        type: 'course_enrollment',
        message: 'Welcome! You have successfully enrolled in Introduction to Web Development',
        read: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'notif-2',
        userId: 'user-1',
        type: 'course_update',
        message: 'New lesson added: React Hooks in "React.js - Build Modern UIs"',
        read: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'notif-3',
        userId: 'user-2',
        type: 'course_enrollment',
        message: 'Welcome! You have successfully enrolled in Advanced Node.js & Express',
        read: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'notif-4',
        userId: 'user-2',
        type: 'assignment',
        message: 'Assignment "Build a REST API" is due in 3 days',
        read: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'notif-5',
        userId: 'user-4',
        type: 'course_enrollment',
        message: 'Welcome! You have successfully enrolled in Introduction to Web Development',
        read: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'notif-6',
        userId: 'user-6',
        type: 'course_enrollment',
        message: 'Welcome! You have successfully enrolled in Database Design with MongoDB',
        read: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'notif-7',
        userId: 'user-7',
        type: 'course_update',
        message: 'Course "Advanced Node.js & Express" has been updated with new content',
        read: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    console.log('📬 Adding notifications...\n');
    for (const notification of notifications) {
      await notificationCollection.notifications.insert(notification);
      console.log(`✅ Added notification: ${notification.id} for ${notification.userId}`);
    }

    console.log('\n✅ Notification seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding notifications:', error.message);
    process.exit(1);
  }
}

seedNotifications();
