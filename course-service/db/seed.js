const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'courses.db');
const db = new Database(DB_PATH);

async function seedCourses() {
  // First, clear existing courses
  db.prepare('DELETE FROM enrollments').run();
  db.prepare('DELETE FROM courses').run();
  console.log('🗑️  Cleared existing courses...\n');

  const courses = [
    {
      id: 'course-1',
      title: 'Introduction to Web Development',
      description: 'Learn HTML, CSS, and JavaScript basics for web development',
      instructor: 'Youssef Cherif',
      price: 29.99,
      category: 'Web Development',
      level: 'beginner'
    },
    {
      id: 'course-2',
      title: 'Advanced Node.js & Express',
      description: 'Master backend development with Node.js and Express framework',
      instructor: 'Khaled Mansour',
      price: 49.99,
      category: 'Backend Development',
      level: 'intermediate'
    },
    {
      id: 'course-3',
      title: 'React.js - Build Modern UIs',
      description: 'Create interactive user interfaces with React components and hooks',
      instructor: 'Youssef Cherif',
      price: 39.99,
      category: 'Frontend Development',
      level: 'intermediate'
    },
    {
      id: 'course-4',
      title: 'Database Design with MongoDB',
      description: 'Design and optimize NoSQL databases using MongoDB',
      instructor: 'Khaled Mansour',
      price: 44.99,
      category: 'Databases',
      level: 'intermediate'
    },
    {
      id: 'course-5',
      title: 'Python for Data Science',
      description: 'Analyze data and create visualizations using Python libraries',
      instructor: 'Leila Bouali',
      price: 59.99,
      category: 'Data Science',
      level: 'beginner'
    },
    {
      id: 'course-6',
      title: 'Full-Stack JavaScript Development',
      description: 'Build complete web applications from frontend to backend using JavaScript',
      instructor: 'Youssef Cherif',
      price: 79.99,
      category: 'Full-Stack',
      level: 'advanced'
    },
    {
      id: 'course-7',
      title: 'API Design & RESTful Services',
      description: 'Design and build scalable REST APIs',
      instructor: 'Khaled Mansour',
      price: 54.99,
      category: 'Backend Development',
      level: 'intermediate'
    },
    {
      id: 'course-8',
      title: 'Git & Version Control Essentials',
      description: 'Master Git workflows and collaboration with version control',
      instructor: 'Leila Bouali',
      price: 19.99,
      category: 'Tools & DevOps',
      level: 'beginner'
    }
  ];

  try {
    for (const courseData of courses) {
      db.prepare('INSERT INTO courses (id, title, description, instructor, price, category, level) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(courseData.id, courseData.title, courseData.description, courseData.instructor, courseData.price, courseData.category, courseData.level);
      
      console.log(`✅ Added course: ${courseData.title} (ID: ${courseData.id})`);
    }

    // Add some enrollments
    const enrollments = [
      { user_id: 'user-1', course_id: 'course-1' },
      { user_id: 'user-1', course_id: 'course-3' },
      { user_id: 'user-2', course_id: 'course-2' },
      { user_id: 'user-2', course_id: 'course-5' },
      { user_id: 'user-4', course_id: 'course-1' },
      { user_id: 'user-4', course_id: 'course-6' },
      { user_id: 'user-6', course_id: 'course-4' },
      { user_id: 'user-6', course_id: 'course-8' },
      { user_id: 'user-7', course_id: 'course-2' },
      { user_id: 'user-7', course_id: 'course-7' }
    ];

    console.log('\n📚 Adding enrollments...\n');
    for (const enrollment of enrollments) {
      const id = `enroll-${enrollment.user_id}-${enrollment.course_id}`;
      db.prepare('INSERT INTO enrollments (id, user_id, course_id) VALUES (?, ?, ?)')
        .run(id, enrollment.user_id, enrollment.course_id);
      console.log(`✅ Enrolled ${enrollment.user_id} in ${enrollment.course_id}`);
    }

    console.log('\n✅ Database seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
  }
}

seedCourses().then(() => process.exit(0));
