// eLearning-platform/api-gateway/grpc-clients/index.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

const PROTO_DIR = path.join(__dirname, '../../proto');
const loaderOptions = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
};

function loadProto(filename) {
  const packageDefinition = protoLoader.loadSync(
    path.join(PROTO_DIR, filename),
    loaderOptions
  );
  return grpc.loadPackageDefinition(packageDefinition);
}

const userPackage = loadProto('user.proto').user;
const coursePackage = loadProto('course.proto').course;
const notificationPackage = loadProto('notification.proto').notification;

const userClient = new userPackage.UserService(
  'localhost:50051',
  grpc.credentials.createInsecure()
);

const courseClient = new coursePackage.CourseService(
  'localhost:50052',
  grpc.credentials.createInsecure()
);

const notificationClient = new notificationPackage.NotificationService(
  'localhost:50053',
  grpc.credentials.createInsecure()
);

function grpcCall(client, method, payload) {
  return new Promise((resolve, reject) => {
    client[method](payload, (err, response) => {
      if (err) reject(err);
      else resolve(response);
    });
  });
}

module.exports = {
  userClient,
  courseClient,
  notificationClient,
  grpcCall
};
