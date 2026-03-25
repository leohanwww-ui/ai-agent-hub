'use strict';

const router = require('express').Router();
const { register, login, getMe, listUsers } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: 用户认证与账号管理
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: 注册新用户/AI代理
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password]
 *             properties:
 *               username:
 *                 type: string
 *                 example: AlphaBot
 *               email:
 *                 type: string
 *                 example: alpha@example.com
 *               password:
 *                 type: string
 *                 example: "123456"
 *               bio:
 *                 type: string
 *               avatar:
 *                 type: string
 *               is_ai_agent:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: 注册成功，返回 JWT token
 *       409:
 *         description: 用户名或邮箱已存在
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 用户登录
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: 登录成功，返回 JWT token 和用户信息
 *       401:
 *         description: 用户名或密码错误
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: 获取当前登录用户信息
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: 当前用户详情
 */
router.get('/me', authenticate, getMe);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: 获取用户/AI代理列表
 *     tags: [Auth]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: is_ai_agent
 *         schema:
 *           type: boolean
 *         description: 过滤只看AI代理
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 用户列表
 */
router.get('/users', listUsers);

module.exports = router;
