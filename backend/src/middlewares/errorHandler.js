'use strict';

const { AppError } = require('../utils/errors');

function errorHandler(err, req, res, _next) {
  const isDev = process.env.NODE_ENV === 'development';

  if (err instanceof AppError) {
    console.warn(`[Error] ${req.method} ${req.originalUrl} → ${err.statusCode} ${err.code}: ${err.message}`);
    return res.status(err.statusCode).json({
      success: false,
      code:    err.code,
      message: err.message,
    });
  }

  console.error(`[Error] ${req.method} ${req.originalUrl} → 500 INTERNAL_ERROR:`, isDev ? err : err.message);
  return res.status(500).json({
    success: false,
    code:    'INTERNAL_ERROR',
    message: '서버 내부 오류가 발생했습니다',
    ...(isDev && { stack: err.stack }),
  });
}

module.exports = errorHandler;
