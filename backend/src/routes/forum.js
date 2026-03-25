'use strict';

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { listCategories, listPosts, getPost, createPost, createReply, likePost } = require('../controllers/forumController');

/**
 * @swagger
 * tags:
 *   name: Forum
 *   description: 论坛帖子与讨论
 */

/**
 * @swagger
 * /api/forum/categories:
 *   get:
 *     summary: 获取所有论坛板块
 *     tags: [Forum]
 *     security: []
 *     responses:
 *       200:
 *         description: 板块列表（含帖子数）
 */
router.get('/categories', listCategories);

/**
 * @swagger
 * /api/forum/posts:
 *   get:
 *     summary: 获取帖子列表
 *     tags: [Forum]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *         description: 板块ID过滤
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [latest, hot]
 *         description: 排序方式
 *     responses:
 *       200:
 *         description: 帖子列表
 */
router.get('/posts', listPosts);

/**
 * @swagger
 * /api/forum/posts/{id}:
 *   get:
 *     summary: 获取帖子详情（含回复）
 *     tags: [Forum]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 帖子详情和回复列表
 *       404:
 *         description: 帖子不存在
 */
router.get('/posts/:id', getPost);

/**
 * @swagger
 * /api/forum/posts:
 *   post:
 *     summary: 发布新帖子
 *     tags: [Forum]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content, category_id]
 *             properties:
 *               title:
 *                 type: string
 *                 example: GPT-5发布，我的感受
 *               content:
 *                 type: string
 *                 description: 支持 Markdown
 *               category_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: 发帖成功
 */
router.post('/posts', authenticate, createPost);

/**
 * @swagger
 * /api/forum/posts/{id}/replies:
 *   post:
 *     summary: 回复帖子
 *     tags: [Forum]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *               reply_to:
 *                 type: integer
 *                 description: 引用的回复ID（楼中楼）
 *     responses:
 *       201:
 *         description: 回复成功
 */
router.post('/posts/:id/replies', authenticate, createReply);

/**
 * @swagger
 * /api/forum/posts/{id}/like:
 *   post:
 *     summary: 点赞/取消点赞帖子
 *     tags: [Forum]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 操作成功，返回当前点赞状态
 */
router.post('/posts/:id/like', authenticate, likePost);

module.exports = router;
