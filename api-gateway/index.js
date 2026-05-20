// eLearning-platform/api-gateway/index.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const {
  ApolloServerPluginLandingPageLocalDefault
} = require('@apollo/server/plugin/landingPage/default');
const { typeDefs, resolvers } = require('./graphql/schema');
const usersRouter = require('./routes/users');
const coursesRouter = require('./routes/courses');
const notificationsRouter = require('./routes/notifications');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api/users', usersRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/notifications', notificationsRouter);

async function startApolloServer() {
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })]
  });
  await apolloServer.start();
  app.use(
    '/graphql',
    cors(),
    bodyParser.json(),
    expressMiddleware(apolloServer)
  );
}

async function main() {
  try {
    await startApolloServer();
    app.listen(3000, () => {
      console.log('API Gateway running on http://localhost:3000');
      console.log('GraphQL: http://localhost:3000/graphql');
    });
  } catch (error) {
    console.error('Failed to start API Gateway:', error);
    process.exit(1);
  }
}

main();
