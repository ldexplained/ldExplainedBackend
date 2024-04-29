const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');
const HapiSwagger = require('hapi-swagger');
const HapiJwt = require('hapi-auth-jwt2');
const knexConfig = require('../knexfile');
const knex = require('knex')(knexConfig.development);
require('dotenv').config();
const { google } = require('googleapis');
const User = require('../models/parentUsers');
const Roles = require('../models/roles');
const EventEmitter = require('events');

class AppEmitter extends EventEmitter { }
const appEmitter = new AppEmitter();

async function init() {
  const server = Hapi.server({
    port: process.env.PORT || 8000,
    // routes: {
    //   // cors: {
    //   //   // "origin": ["Access-Control-Allow-Origin", "192.168.1.13:4200"],
    //   //   // Allow requests from any origin (global access)
    //   //   origin: ['*'],
    //   //   headers: ['Accept', 'Content-Type'],
    //   //   additionalHeaders: ['cache-control', 'x-requested-with']
    //   // }
    //   "cors": true
    // }
    routes: {
      cors: {
          origin: ['*'], // an array of origins or 'ignore'
          headers: ['Accept', 'Authorization', 'Content-Type', 'If-None-Match', 'Accept-language'], // all default apart from Accept-language
          additionalHeaders: ['cache-control', 'x-requested-with', 'Access-Control-Allow-Origin']
      }
  },

  });

  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URL
  );

  const scopes = ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/calendar'];

  const calendar = google.calendar({
    version: "v3",
    auth: process.env.API_KEY
  });

  await server.register([
    Inert,
    Vision,
    HapiJwt,
    {
      plugin: HapiSwagger,
      options: {
        info: {
          title: 'LD-EXPLAINED API Documentation',
          version: '1.0'
        },
        securityDefinitions: {
          jwt: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header'
          }
        },
        schemes: ['http', 'https'],
        security: [{ jwt: [] }]
      }
    }
  ]);

  const validate = async (decoded, request, h) => {
    const user = await User.query().findById(decoded.id);
    if (!user) {
      return { isValid: false };
    }
    let checkRole = await Roles.query().where('email', user.email).first();
    if (checkRole.role !== undefined && checkRole.role !== null) {
      user.role = checkRole.role;
    } else {
      user.role = null;
    }
    return { isValid: true, credentials: user };
  };

  server.auth.strategy('jwt', 'jwt', {
    key: process.env.JWT_SECRET,
    validate,
    verifyOptions: { algorithms: ['HS256'] }
  });

  // server.auth.default('jwt');

  server.events.on('response', (request) => {
    const logMessage = `${new Date().toISOString()} ${request.info.remoteAddress}: ${request.method.toUpperCase()} ${request.path} --> ${request.response.statusCode}`;
    console.log(logMessage);
  });

  await server.start();
  console.log(`Server running on ${server.info.uri}`);

  // Emit an event indicating that the resources are ready
  appEmitter.emit('ready', { server, knex, oauth2Client, scopes, calendar });
}

process.on('unhandledRejection', (err) => {
  console.error(err);
  process.exit(1);
});

module.exports = { init, appEmitter }; // Export both init and the EventEmitter