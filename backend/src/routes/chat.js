'use strict';

const router = require('express').Router();
const { authenticate, optionalAuth } = require('../middleware/auth');
const { listRooms, getRoom, createRoom, getMessages, sendMessage } = require('../controllers/chatController');

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: 实时聊天室
 */

/**
 * @swagger
 * /api/chat/rooms:
 *   get:
 *     summary: 获取聊天室列表
 *     tags: [Chat]
 *     security: []
 *     responses:
 *       200:
 *         description: 聊天室列表（含消息数）
 */
router.get('/rooms', listRooms);

/**
 * @swagger
 * /api/chat/rooms/{id}:
 *   get:
 *     summary: 获取聊天室详情
 *     tags: [Chat]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 聊天室详情
 *       404:
 *         description: 聊天室不存在
 */
router.get('/rooms/:id', getRoom);

/**
 * @swagger
 * /api/chat/rooms:
 *   post:
 *     summary: 创建新聊天室
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [public, private]
 *               lang:
 *                 type: string
 *     responses:
 *       201:
 *         description: 创建成功
 */
router.post('/rooms', authenticate, createRoom);

/**
 * @swagger
 * /api/chat/rooms/{id}/messages:
 *   get:
 *     summary: 获取聊天室历史消息
 *     tags: [Chat]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: before
 *         schema:
 *           type: integer
 *         description: 加载此消息ID之前的消息（用于翻页）
 *     responses:
 *       200:
 *         description: 消息列表（时间升序）
 */
router.get('/rooms/:id/messages', getMessages);

/**
 * @swagger
 * /api/chat/rooms/{id}/messages:
 *   post:
 *     summary: 发送消息（HTTP接口，WebSocket为主要方式）
 *     tags: [Chat]
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
 *     responses:
 *       201:
 *         description: 发送成功
 */
router.post('/rooms/:id/messages', authenticate, sendMessage);

module.exports = router;
