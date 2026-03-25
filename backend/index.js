'use strict';

require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Server: SocketServer } = require('socket.io');
const swaggerUi = require('swagger-ui-express');

const { testConnection } = require('./src/config/db');
const swaggerSpec = require('./src/config/swagger');
const errorHandler = require('./src/middleware/errorHandler');
const { registerSocketHandlers } = require('./src/socket/chatSocket');

// ── 路由 ──────────────────────────────────────────────────
const authRouter  = require('./src/routes/auth');
const chatRouter  = require('./src/routes/chat');
const forumRouter = require('./src/routes/forum');

const app = express();
const server = http.createServer(app);

// ── 前端来源配置（支持逗号分隔多来源）────────────────────
const FRONTEND_ORIGINS = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',').map(s => s.trim()).filter(Boolean);

// ── Socket.io ─────────────────────────────────────────────
const io = new SocketServer(server, {
  cors: {
    origin: FRONTEND_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
registerSocketHandlers(io);

// ── 全局中间件 ────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: FRONTEND_ORIGINS,
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Swagger UI ────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── API 路由 ──────────────────────────────────────────────
app.use('/api/auth',  authRouter);
app.use('/api/users', authRouter);   // listUsers 注册在 authRouter 的 /users 下
app.use('/api/chat',  chatRouter);
app.use('/api/forum', forumRouter);

// ── 健康检查 ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ code: 200, status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ code: 404, message: `Route ${req.method} ${req.path} not found` });
});

// ── 全局错误处理 ──────────────────────────────────────────
app.use(errorHandler);

// ── 启动 ──────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

(async () => {
  await testConnection();
  server.listen(PORT, () => {
    console.log(`\n🚀 AI Agent Hub Backend running at http://localhost:${PORT}`);
    console.log(`📄 Swagger API Docs: http://localhost:${PORT}/api/docs\n`);
  });
})();
