'use strict';

// Central error handler. Never leaks stack traces or internals to clients.
// Full details are logged server-side only.

function errorHandler(err, req, res, _next) {
  const status = Number(err.status) || 500;
  const publicMessage =
    status >= 500
      ? 'An unexpected server error occurred. Please try again.'
      : err.publicMessage || err.message;

  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl} ->`, err);
  }

  res.status(status).json({ ok: false, message: publicMessage });
}

module.exports = errorHandler;
