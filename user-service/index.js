// eLearning-platform/user-service/index.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const {
  insertUser,
  getUserById,
  updateUser,
  deleteUser,
  listUsers
} = require('./db/database');
const { publishUserRegistered } = require('./kafka/producer');

const PROTO_PATH = path.join(__dirname, '../proto/user.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const userProto = grpc.loadPackageDefinition(packageDefinition).user;

const implementations = {
  async RegisterUser(call, callback) {
    try {
      const { name, email, password, role } = call.request;
      if (!name || !email || !password) {
        return callback({
          code: grpc.status.INVALID_ARGUMENT,
          message: 'name, email and password are required'
        });
      }
      const id = uuidv4();
      const createdAt = new Date().toISOString();
      const user = insertUser({
        id,
        name,
        email,
        password,
        role: role || 'student',
        createdAt
      });
      await publishUserRegistered(id, email, name);
      callback(null, user);
    } catch (error) {
      console.error('RegisterUser error:', error);
      if (error.message && error.message.includes('UNIQUE')) {
        return callback({
          code: grpc.status.ALREADY_EXISTS,
          message: 'Email already registered'
        });
      }
      callback({ code: grpc.status.INTERNAL, message: error.message });
    }
  },

  GetUser(call, callback) {
    try {
      const user = getUserById(call.request.id);
      if (!user) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: 'User not found'
        });
      }
      callback(null, user);
    } catch (error) {
      console.error('GetUser error:', error);
      callback({ code: grpc.status.INTERNAL, message: error.message });
    }
  },

  UpdateUser(call, callback) {
    try {
      const { id, name, email } = call.request;
      const user = updateUser(id, name, email);
      if (!user) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: 'User not found'
        });
      }
      callback(null, user);
    } catch (error) {
      console.error('UpdateUser error:', error);
      callback({ code: grpc.status.INTERNAL, message: error.message });
    }
  },

  DeleteUser(call, callback) {
    try {
      const success = deleteUser(call.request.id);
      if (!success) {
        return callback(null, { success: false, message: 'User not found' });
      }
      callback(null, { success: true, message: 'User deleted' });
    } catch (error) {
      console.error('DeleteUser error:', error);
      callback({ code: grpc.status.INTERNAL, message: error.message });
    }
  },

  ListUsers(call, callback) {
    try {
      const users = listUsers();
      callback(null, { users });
    } catch (error) {
      console.error('ListUsers error:', error);
      callback({ code: grpc.status.INTERNAL, message: error.message });
    }
  }
};

function main() {
  const server = new grpc.Server();
  server.addService(userProto.UserService.service, implementations);
  server.bindAsync(
    '0.0.0.0:50051',
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        console.error('Failed to start user-service:', err);
        process.exit(1);
      }
      console.log(`User service running on port ${port}`);
    }
  );
}

main();
