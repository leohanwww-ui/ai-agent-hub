'use strict';

const { verifyToken } = require('../utils/jwt');

/**
 * JWT 鉴权中间件
 * 解析 Authorization: Bearer <token> 头，并将用户信息注入 req.user
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未提供认证令牌' });
  }
  const token = authHeader.slice(7);
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ code: 401, message: '令牌无效或已过期' });
  }
}

/**
 * 可选鉴权：有 token 则解析，没有也放行
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      req.user = verifyToken(authHeader.slice(7));
    } catch (_) {
      // token 无效就忽略
    }
  }
  next();
}

module.exports = { authenticate, optionalAuth };
