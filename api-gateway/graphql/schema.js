// eLearning-platform/api-gateway/graphql/schema.js
const { userClient, courseClient, notificationClient, grpcCall } = require('../grpc-clients');

const typeDefs = `
  type User {
    id: ID!
    name: String!
    email: String!
    role: String!
    createdAt: String
  }

  type Course {
    id: ID!
    title: String!
    description: String
    instructorId: String!
    price: Float
    createdAt: String
  }

  type Enrollment {
    id: ID!
    studentId: String!
    courseId: String!
    enrolledAt: String
  }

  type Notification {
    id: ID!
    userId: String!
    type: String!
    message: String!
    createdAt: String
  }

  type Query {
    getUser(id: ID!): User
    listUsers: [User]
    getCourse(id: ID!): Course
    listCourses: [Course]
    getEnrollments(studentId: ID!): [Enrollment]
    getNotifications(userId: ID!): [Notification]
  }

  type Mutation {
    registerUser(name: String!, email: String!, password: String!, role: String): User
    updateUser(id: ID!, name: String, email: String): User
    deleteUser(id: ID!): Boolean
    createCourse(title: String!, description: String, instructorId: String!, price: Float): Course
    enrollStudent(studentId: String!, courseId: String!): Boolean
  }
`;

const resolvers = {
  Query: {
    getUser: async (_, { id }) => grpcCall(userClient, 'GetUser', { id }),
    listUsers: async () => {
      const result = await grpcCall(userClient, 'ListUsers', {});
      return result.users || [];
    },
    getCourse: async (_, { id }) => grpcCall(courseClient, 'GetCourse', { id }),
    listCourses: async () => {
      const result = await grpcCall(courseClient, 'ListCourses', {});
      return result.courses || [];
    },
    getEnrollments: async (_, { studentId }) => {
      const result = await grpcCall(courseClient, 'GetEnrollments', { studentId });
      return result.enrollments || [];
    },
    getNotifications: async (_, { userId }) => {
      const result = await grpcCall(notificationClient, 'GetNotifications', { userId });
      return result.notifications || [];
    }
  },
  Mutation: {
    registerUser: async (_, args) => grpcCall(userClient, 'RegisterUser', args),
    updateUser: async (_, { id, name, email }) =>
      grpcCall(userClient, 'UpdateUser', { id, name, email }),
    deleteUser: async (_, { id }) => {
      const result = await grpcCall(userClient, 'DeleteUser', { id });
      return result.success;
    },
    createCourse: async (_, args) => grpcCall(courseClient, 'CreateCourse', args),
    enrollStudent: async (_, { studentId, courseId }) => {
      const result = await grpcCall(courseClient, 'EnrollStudent', { studentId, courseId });
      return result.success;
    }
  }
};

module.exports = { typeDefs, resolvers };
