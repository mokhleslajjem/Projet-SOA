const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('./db/database');
const { connect: connectKafka, publishEvent } = require('./kafka/producer');

const PROTO_PATH = path.join(__dirname, '../proto/course.proto');
const PORT = process.env.COURSE_SERVICE_PORT || '50052';

const packageDef = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true
});
const courseProto = grpc.loadPackageDefinition(packageDef).course;

const createCourse = (call, callback) => {
  const { title, description, instructor, price, category, level } = call.request;
  try {
    if (!title || !instructor)
      return callback(null, { status: 'ERROR', error: 'Titre et instructeur requis' });
    const id = uuidv4();
    db.prepare('INSERT INTO courses (id, title, description, instructor, price, category, level) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, title, description || '', instructor, price || 0, category || 'General', level || 'beginner');
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
    callback(null, { ...course, status: 'SUCCESS' });
  } catch (error) {
    callback(null, { status: 'ERROR', error: error.message });
  }
};

const getCourse = (call, callback) => {
  const { id } = call.request;
  try {
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
    if (!course) return callback(null, { status: 'ERROR', error: 'Cours non trouvé' });
    callback(null, { ...course, status: 'SUCCESS' });
  } catch (error) {
    callback(null, { status: 'ERROR', error: error.message });
  }
};

const listCourses = (call, callback) => {
  try {
    const courses = db.prepare('SELECT * FROM courses').all();
    callback(null, { courses: courses.map(c => ({ ...c, status: 'SUCCESS' })), status: 'SUCCESS' });
  } catch (error) {
    callback(null, { courses: [], status: 'ERROR' });
  }
};

const updateCourse = (call, callback) => {
  const { id, title, description, price, category, level } = call.request;
  try {
    const existing = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
    if (!existing) return callback(null, { status: 'ERROR', error: 'Cours non trouvé' });
    db.prepare(`UPDATE courses SET
      title = COALESCE(NULLIF(?, ''), title),
      description = COALESCE(NULLIF(?, ''), description),
      price = CASE WHEN ? > 0 THEN ? ELSE price END,
      category = COALESCE(NULLIF(?, ''), category),
      level = COALESCE(NULLIF(?, ''), level)
      WHERE id = ?`).run(title, description, price, price, category, level, id);
    const updated = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
    callback(null, { ...updated, status: 'SUCCESS' });
  } catch (error) {
    callback(null, { status: 'ERROR', error: error.message });
  }
};

const deleteCourse = (call, callback) => {
  const { id } = call.request;
  try {
    const existing = db.prepare('SELECT id FROM courses WHERE id = ?').get(id);
    if (!existing) return callback(null, { status: 'ERROR', message: 'Cours non trouvé' });
    db.prepare('DELETE FROM courses WHERE id = ?').run(id);
    callback(null, { status: 'SUCCESS', message: 'Cours supprimé' });
  } catch (error) {
    callback(null, { status: 'ERROR', message: error.message });
  }
};

const enrollUser = async (call, callback) => {
  const { user_id, course_id } = call.request;
  try {
    if (!user_id || !course_id)
      return callback(null, { status: 'ERROR', error: 'user_id et course_id requis' });
    const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(course_id);
    if (!course) return callback(null, { status: 'ERROR', error: 'Cours non trouvé' });
    const existing = db.prepare('SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?').get(user_id, course_id);
    if (existing) return callback(null, { status: 'ERROR', error: 'Déjà inscrit à ce cours' });
    const id = uuidv4();
    db.prepare('INSERT INTO enrollments (id, user_id, course_id) VALUES (?, ?, ?)').run(id, user_id, course_id);
    const enrollment = db.prepare('SELECT * FROM enrollments WHERE id = ?').get(id);
    await publishEvent('course.enrolled', {
      enrollmentId: id, userId: user_id, courseId: course_id,
      courseTitle: course.title, timestamp: new Date().toISOString()
    });
    callback(null, { ...enrollment, status: 'SUCCESS' });
  } catch (error) {
    callback(null, { status: 'ERROR', error: error.message });
  }
};

const getEnrollments = (call, callback) => {
  const { user_id } = call.request;
  try {
    const enrollments = db.prepare('SELECT * FROM enrollments WHERE user_id = ?').all(user_id);
    callback(null, { enrollments: enrollments.map(e => ({ ...e, status: 'SUCCESS' })), status: 'SUCCESS' });
  } catch (error) {
    callback(null, { enrollments: [], status: 'ERROR' });
  }
};

const start = async () => {
  await connectKafka();
  const server = new grpc.Server();
  server.addService(courseProto.CourseService.service, {
    CreateCourse: createCourse, GetCourse: getCourse, ListCourses: listCourses,
    UpdateCourse: updateCourse, DeleteCourse: deleteCourse,
    EnrollUser: enrollUser, GetEnrollments: getEnrollments
  });
  server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
    if (err) { console.error('❌ Erreur:', err); process.exit(1); }
    console.log(`🚀 Course Service démarré sur le port ${port}`);
  });
};

start();