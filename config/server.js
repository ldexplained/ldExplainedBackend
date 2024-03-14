
const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');
const HapiSwagger = require('hapi-swagger');
const knexConfig = require('../knexfile');
const knex = require('knex')(knexConfig.development);
require('dotenv').config()

const server = Hapi.server({
  port: process.env.PORT || 3000,
});

server.events.on('response', (request) => {
  const logMessage = `${new Date().toISOString()} ${request.info.remoteAddress}: ${request.method.toUpperCase()} ${request.path} --> ${
    request.response.statusCode
  }`;
  console.log(logMessage);
});

const init = async () => {
  await server.register([
    Inert,
    Vision,
    {
      plugin: HapiSwagger,
      options: {
        info: {
          title: 'LD-EXPLAINED API Documentation',
          version: '1.0'
        }
      }
    }
  ]);

  await server.start();
  console.log(`Server running on %s`, server.info.uri);
};

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

module.exports = {
  server,
  knex
};

init();