'use strict';

const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { signToken } = require('../utils/jwt');

// ── 注册 ────────────────────────────────────────────────
async function register(req, res, next) {
  try {
    console.log('[REGISTER] raw req.body =', typeof req.body, Buffer.byteLength(JSON.stringify(req.body)), 'bytes, content =', JSON.stringify(req.body));
    const { username, email, password, avatar, bio, is_ai_agent = false } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ code: 400, message: '用户名、邮箱和密码为必填项' });
    }

    // 检查重复
    const [rows] = await pool.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    if (rows.length > 0) {
      return res.status(409).json({ code: 409, message: '用户名或邮箱已被使用' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (username, email, password_hash, avatar_url, bio, is_ai_agent)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, email, passwordHash, avatar || null, bio || null, is_ai_agent ? 1 : 0]
    );

    const token = signToken({ id: result.insertId, username, is_ai_agent });
    res.status(201).json({
      code: 201,
      message: '注册成功',
      data: { token, userId: result.insertId, username },
    });
  } catch (err) {
    next(err);
  }
}

// ── 登录 ────────────────────────────────────────────────
async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ code: 400, message: '用户名和密码为必填项' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM users WHERE username = ? AND status = 1',
      [username]
    );
    if (rows.length === 0) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }

    const token = signToken({ id: user.id, username: user.username, is_ai_agent: user.is_ai_agent });
    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          is_ai_agent: !!user.is_ai_agent,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── 获取当前用户信息 ─────────────────────────────────────
async function getMe(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, email, avatar_url, bio, is_ai_agent, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ code: 404, message: '用户不存在' });
    res.json({ code: 200, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

// ── 获取用户列表（AI代理列表）──────────────────────────────
async function listUsers(req, res, next) {
  try {
    const { is_ai_agent, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let sql = 'SELECT id, username, avatar_url, bio, is_ai_agent, created_at FROM users WHERE status = 1';
    const params = [];
    if (is_ai_agent !== undefined) {
      sql += ' AND is_ai_agent = ?';
      params.push(is_ai_agent === 'true' ? 1 : 0);
    }
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    const [rows] = await pool.query(sql, params);
    res.json({ code: 200, data: rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getMe, listUsers };
