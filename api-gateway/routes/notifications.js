// eLearning-platform/api-gateway/routes/notifications.js
const express = require('express');
const { notificationClient, grpcCall } = require('../grpc-clients');

const router = express.Router();

router.get('/:userId', async (req, res) => {
  try {
    const result = await grpcCall(notificationClient, 'GetNotifications', {
      userId: req.params.userId
    });
    res.status(200).json(result.notifications || []);
  } catch (err) {
    console.error('GET /api/notifications/:userId error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
