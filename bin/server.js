'use strict';

const http = require('http');
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const errorMiddleware = require('express-error-responses').middleware;
const access = require('@amedia/amedia-access-log');

const config = require('../config');
const log = require('./log');
const errorLogMiddleware = require('./errorLogMiddleware');

const app = express();

function setupErrorHandling() {
  app.use(errorLogMiddleware);
  app.use(errorMiddleware.response);
  app.use(errorMiddleware.status404);
}

function setupHeaders() {
  app.disable('x-powered-by');
  app.enable('trust proxy');
  app.use(cors());
}

function setupMiddleware() {
  app.use(compression());
}

function setupPing() {
  // Set ping route before access logging
  app.get(`${config.get('contextPath')}/apiadmin/ping`,
    (req, res) => {
      const message = `OK ${config.get('version')}`;
      res.statusMessage = message;
      res.send(message);
    });
}

function setupRoutes() {
  app.use(config.get('apiPath'), express.static('dist'));
}

setupHeaders();
setupMiddleware();
setupPing();
app.use(access(log));
setupRoutes();
setupErrorHandling();

// Start application
const server = http.createServer(app);
server.listen(config.get('httpServerPort'), () => {
  log.info(`server process has pid ${process.pid}`);
  log.info(`api routes available under ${config.get('apiPath')}`);
});

// Catch uncaught exceptions, log it and take down server in a nice way.
// Upstart or forever should handle kicking the process back into life!
process.on('uncaughtException', (error) => {
  if (error instanceof Error) {
    log.error(error, `Uncaught exception ${error.name}`);
  }
  server.close();
  process.nextTick(() => process.exit(1));
});

// Listen for SIGINT (Ctrl+C) and do a gracefull takedown of the server
process.on('SIGINT', () => {
  log.info('shutdown - got SIGINT - taking down server gracefully');
  server.close();
  process.nextTick(() => process.exit(0));
});

// Listen for SIGTERM (Upstart) and do a gracefull takedown of the server
process.on('SIGTERM', () => {
  log.info('shutdown - got SIGTERM - taking down server gracefully');
  server.close();
  process.nextTick(() => process.exit(0));
});
