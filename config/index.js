'use strict';

const convict = require('convict');
const fs = require('fs');
const path = require('path');
const pckage = require('../package.json');

const config = convict({
  env: {
    doc: 'Applicaton environments',
    format: ['development', 'production'],
    default: 'development',
    env: 'NODE_ENV',
    arg: 'env',
  },

  serverType: {
    doc: 'Which type of server this is',
    format: String,
    default: 'dev',
    env: 'API_SERVER_TYPE',
  },

  serverName: {
    doc: 'The name of the server',
    format: String,
    default: 'dev',
    env: 'API_SERVER_NAME',
  },

  httpServerPort: {
    doc: 'The port the server should bind to',
    format: 'port',
    default: 9693,
    env: 'PORT',
    arg: 'port',
  },

  consoleLogLevel: {
    doc: 'Which level the console transport log should log at',
    format: String,
    default: 'info',
    env: 'LOG_LEVEL',
  },

  version: {
    doc: 'Version of the application',
    format: String,
    default: pckage.version,
  },

  name: {
    doc: 'Name of the application',
    format: String,
    default: pckage.name,
  },

  contextPath: {
    doc: 'Context path for the application. Serves as a prefix for the paths in all URLs',
    format: String,
    default: `/${pckage.name}`,
  },

  apiPath: {
    doc: 'The prefix for all API routes intended to be accessed by the browser',
    format: String,
    default: `/api/${pckage.name}`,
  },
});

// Load config files
if (fs.existsSync(path.resolve(__dirname, '../config/local.json'))) {
  config.loadFile([path.resolve(__dirname, '../config/', `${config.get('env')}.json`), path.resolve(__dirname, '../config/local.json')]);
} else {
  config.loadFile([path.resolve(__dirname, '../config/', `${config.get('env')}.json`)]);
}

// Validate that all properties are defined in the schema and has correct value type
config.validate({ allowed: 'strict' });

module.exports = config;
