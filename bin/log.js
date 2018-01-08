'use strict';

const bunyan = require('bunyan');
const config = require('../config');

const streams = [
  {
    level: config.get('consoleLogLevel'),
    stream: process.stdout,
  },
];

module.exports = bunyan.createLogger({
  name: config.get('name'),
  application: config.get('name'),
  serverName: config.get('serverName'),
  level: config.get('consoleLogLevel'),
  serializers: bunyan.stdSerializers,
  streams,
});
