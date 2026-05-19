// eLearning-platform/api-gateway/routes/users.js
const express = require('express');
const grpc = require('@grpc/grpc-js');
const { userClient, grpcCall } = require('../grpc-clients');

const router = express.Router();

function grpcCode(err) {
  return err.code || grpc.status.UNKNOWN;
}

router.post('/', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const user = await grpcCall(userClient, 'RegisterUser', {
      name,
      email,
      password,
      role
    });
    res.status(201).json(user);
  } catch (err) {
    console.error('POST /api/users error:', err);
    if (grpcCode(err) === grpc.status.ALREADY_EXISTS) {
      return res.status(400).json({ error: err.message });
    }
    if (grpcCode(err) === grpc.status.INVALID_ARGUMENT) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await grpcCall(userClient, 'ListUsers', {});
    res.status(200).json(result.users || []);
  } catch (err) {
    console.error('GET /api/users error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const user = await grpcCall(userClient, 'GetUser', { id: req.params.id });
    res.status(200).json(user);
  } catch (err) {
    console.error('GET /api/users/:id error:', err);
    if (grpcCode(err) === grpc.status.NOT_FOUND) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await grpcCall(userClient, 'UpdateUser', {
      id: req.params.id,
      name,
      email
    });
    res.status(200).json(user);
  } catch (err) {
    console.error('PUT /api/users/:id error:', err);
    if (grpcCode(err) === grpc.status.NOT_FOUND) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await grpcCall(userClient, 'DeleteUser', { id: req.params.id });
    if (!result.success) {
      return res.status(404).json({ error: result.message });
    }
    res.status(200).json(result);
  } catch (err) {
    console.error('DELETE /api/users/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
