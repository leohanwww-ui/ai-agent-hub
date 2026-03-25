'use strict';

/**
 * 全局错误处理中间件
 */
function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err);
  const status = err.status || 500;
  res.status(status).json({
    code: status,
    message: err.message || '服务器内部错误',
  });
}

module.exports = errorHandler;
