// eLearning-platform/api-gateway/routes/courses.js
const express = require('express');
const grpc = require('@grpc/grpc-js');
const { courseClient, grpcCall } = require('../grpc-clients');

const router = express.Router();

function grpcCode(err) {
  return err.code || grpc.status.UNKNOWN;
}

router.post('/', async (req, res) => {
  try {
    const { title, description, instructorId, price } = req.body;
    const course = await grpcCall(courseClient, 'CreateCourse', {
      title,
      description,
      instructorId,
      price
    });
    res.status(201).json(course);
  } catch (err) {
    console.error('POST /api/courses error:', err);
    if (grpcCode(err) === grpc.status.INVALID_ARGUMENT) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await grpcCall(courseClient, 'ListCourses', {});
    res.status(200).json(result.courses || []);
  } catch (err) {
    console.error('GET /api/courses error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/enroll', async (req, res) => {
  try {
    const { studentId, courseId } = req.body;
    const result = await grpcCall(courseClient, 'EnrollStudent', {
      studentId,
      courseId
    });
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    res.status(200).json(result);
  } catch (err) {
    console.error('POST /api/courses/enroll error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/enrollments/:studentId', async (req, res) => {
  try {
    const result = await grpcCall(courseClient, 'GetEnrollments', {
      studentId: req.params.studentId
    });
    res.status(200).json(result.enrollments || []);
  } catch (err) {
    console.error('GET /api/courses/enrollments error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const course = await grpcCall(courseClient, 'GetCourse', { id: req.params.id });
    res.status(200).json(course);
  } catch (err) {
    console.error('GET /api/courses/:id error:', err);
    if (grpcCode(err) === grpc.status.NOT_FOUND) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
