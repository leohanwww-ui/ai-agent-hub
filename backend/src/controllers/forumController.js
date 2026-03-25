'use strict';

const { pool } = require('../config/db');

// ── 获取论坛板块列表 ─────────────────────────────────────
async function listCategories(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT fc.*
       FROM forum_categories fc
       ORDER BY fc.sort_order ASC`
    );
    res.json({ code: 200, data: rows });
  } catch (err) {
    next(err);
  }
}

// ── 获取帖子列表 ─────────────────────────────────────────
async function listPosts(req, res, next) {
  try {
    const { category_id, page = 1, limit = 20, sort = 'latest' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let sql = `
      SELECT fp.id, fp.title, fp.content, fp.view_count, fp.like_count, fp.reply_count,
             fp.is_pinned, fp.created_at, fp.updated_at,
             u.id AS author_id, u.username AS author_name, u.avatar_url AS author_avatar,
             u.is_ai_agent AS author_is_ai,
             fc.id AS category_id, fc.name AS category_name, fc.icon AS category_icon
      FROM forum_posts fp
      JOIN users u ON u.id = fp.author_id
      JOIN forum_categories fc ON fc.id = fp.category_id
      WHERE fp.is_deleted = 0`;
    const params = [];

    if (category_id) {
      sql += ' AND fp.category_id = ?';
      params.push(parseInt(category_id));
    }

    if (sort === 'hot') {
      sql += ' ORDER BY fp.is_pinned DESC, fp.like_count DESC, fp.reply_count DESC';
    } else {
      sql += ' ORDER BY fp.is_pinned DESC, fp.created_at DESC';
    }

    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [rows] = await pool.query(sql, params);
    res.json({ code: 200, data: rows });
  } catch (err) {
    next(err);
  }
}

// ── 获取帖子详情 ─────────────────────────────────────────
async function getPost(req, res, next) {
  try {
    const { id } = req.params;

    // 增加浏览数
    await pool.query('UPDATE forum_posts SET view_count = view_count + 1 WHERE id = ?', [id]);

    const [rows] = await pool.query(
      `SELECT fp.*, u.username AS author_name, u.avatar_url AS author_avatar, u.is_ai_agent AS author_is_ai,
              fc.name AS category_name, fc.icon AS category_icon
       FROM forum_posts fp
       JOIN users u ON u.id = fp.author_id
       JOIN forum_categories fc ON fc.id = fp.category_id
       WHERE fp.id = ? AND fp.is_deleted = 0`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ code: 404, message: '帖子不存在' });

    // 获取回复
    const [replies] = await pool.query(
      `SELECT fr.*, u.username, u.avatar_url, u.is_ai_agent
       FROM forum_replies fr
       JOIN users u ON u.id = fr.author_id
       WHERE fr.post_id = ? AND fr.is_deleted = 0
       ORDER BY fr.created_at ASC`,
      [id]
    );

    res.json({ code: 200, data: { ...rows[0], replies } });
  } catch (err) {
    next(err);
  }
}

// ── 发帖 ─────────────────────────────────────────────────
async function createPost(req, res, next) {
  try {
    const { title, content, category_id } = req.body;
    if (!title || !content || !category_id) {
      return res.status(400).json({ code: 400, message: '标题、内容和板块为必填项' });
    }
    const [result] = await pool.query(
      'INSERT INTO forum_posts (title, content, category_id, author_id) VALUES (?, ?, ?, ?)',
      [title, content, category_id, req.user.id]
    );
    res.status(201).json({ code: 201, message: '发帖成功', data: { id: result.insertId } });
  } catch (err) {
    next(err);
  }
}

// ── 回复帖子 ─────────────────────────────────────────────
async function createReply(req, res, next) {
  try {
    const { id: post_id } = req.params;
    const { content, reply_to } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ code: 400, message: '回复内容不能为空' });
    }
    const [result] = await pool.query(
      'INSERT INTO forum_replies (post_id, author_id, content, parent_id) VALUES (?, ?, ?, ?)',
      [post_id, req.user.id, content.trim(), reply_to || null]
    );
    await pool.query('UPDATE forum_posts SET reply_count = reply_count + 1 WHERE id = ?', [post_id]);
    res.status(201).json({ code: 201, message: '回复成功', data: { id: result.insertId } });
  } catch (err) {
    next(err);
  }
}

// ── 点赞帖子 ─────────────────────────────────────────────
async function likePost(req, res, next) {
  try {
    const { id: post_id } = req.params;
    const user_id = req.user.id;

    const [existing] = await pool.query(
      "SELECT id FROM likes WHERE target_type = 'post' AND target_id = ? AND user_id = ?",
      [post_id, user_id]
    );

    if (existing.length > 0) {
      await pool.query("DELETE FROM likes WHERE target_type = 'post' AND target_id = ? AND user_id = ?", [post_id, user_id]);
      await pool.query('UPDATE forum_posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = ?', [post_id]);
      return res.json({ code: 200, message: '已取消点赞', data: { liked: false } });
    }

    await pool.query("INSERT INTO likes (target_type, target_id, user_id) VALUES ('post', ?, ?)", [post_id, user_id]);
    await pool.query('UPDATE forum_posts SET like_count = like_count + 1 WHERE id = ?', [post_id]);
    res.json({ code: 200, message: '点赞成功', data: { liked: true } });
  } catch (err) {
    next(err);
  }
}

module.exports = { listCategories, listPosts, getPost, createPost, createReply, likePost };
