'use strict';

const { pool } = require('../config/db');

// ── 获取所有聊天室 ───────────────────────────────────────
async function listRooms(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT cr.*, u.username AS creator_name,
              (SELECT COUNT(*) FROM chat_messages cm WHERE cm.room_id = cr.id) AS message_count
       FROM chat_rooms cr
       LEFT JOIN users u ON u.id = cr.created_by
       ORDER BY cr.is_default DESC, cr.sort_order ASC`
    );
    res.json({ code: 200, data: rows });
  } catch (err) {
    next(err);
  }
}

// ── 获取聊天室详情 ───────────────────────────────────────
async function getRoom(req, res, next) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      'SELECT * FROM chat_rooms WHERE id = ?',
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ code: 404, message: '聊天室不存在' });
    res.json({ code: 200, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

// ── 创建聊天室 ───────────────────────────────────────────
async function createRoom(req, res, next) {
  try {
    const { name, description, room_type = 'public' } = req.body;
    if (!name) return res.status(400).json({ code: 400, message: '聊天室名称为必填项' });
    const [result] = await pool.query(
      'INSERT INTO chat_rooms (name, description, room_type, created_by) VALUES (?, ?, ?, ?)',
      [name, description || null, room_type, req.user.id]
    );
    res.status(201).json({ code: 201, message: '创建成功', data: { id: result.insertId, name } });
  } catch (err) {
    next(err);
  }
}

// ── 获取聊天历史消息 ─────────────────────────────────────
async function getMessages(req, res, next) {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50, before } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let sql = `
      SELECT cm.*, u.username, u.avatar_url, u.is_ai_agent
      FROM chat_messages cm
      JOIN users u ON u.id = cm.user_id
      WHERE cm.room_id = ? AND cm.is_deleted = 0`;
    const params = [id];

    if (before) {
      sql += ' AND cm.id < ?';
      params.push(parseInt(before));
    }

    sql += ' ORDER BY cm.created_at ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [rows] = await pool.query(sql, params);
    res.json({ code: 200, data: rows });
  } catch (err) {
    next(err);
  }
}

// ── 发送消息（HTTP接口，WebSocket为主）──────────────────────
async function sendMessage(req, res, next) {
  try {
    const { id: room_id } = req.params;
    const { content, reply_to } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ code: 400, message: '消息内容不能为空' });
    }
    const [result] = await pool.query(
      'INSERT INTO chat_messages (room_id, user_id, content, reply_to_id) VALUES (?, ?, ?, ?)',
      [room_id, req.user.id, content.trim(), reply_to || null]
    );
    res.status(201).json({ code: 201, message: '发送成功', data: { id: result.insertId } });
  } catch (err) {
    next(err);
  }
}

module.exports = { listRooms, getRoom, createRoom, getMessages, sendMessage };
