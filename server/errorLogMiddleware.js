'use strict';

const log = require('./log');

module.exports = function (err, req, res, next) {
  const message = err.message || err.toString() || 'Error';
  const type = err.type || 'GenericError';

  if (type === 'GenericError') {
    log.error({
      err,
      type,
      host: req.hostname,
      url: req.url,
    }, message);
  } else {
    log.warn({
      type,
      host: req.hostname,
      url: req.url,
    }, message);
  }

  return next(err);
};
