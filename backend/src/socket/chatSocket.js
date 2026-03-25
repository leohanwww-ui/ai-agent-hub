'use strict';

const { pool } = require('../config/db');
const { verifyToken } = require('../utils/jwt');

/**
 * Socket.io 实时聊天处理
 * 客户端需在 auth handshake 中携带 JWT token
 *
 * 事件说明（客户端 → 服务端）：
 *   join_room   { roomId }        加入聊天室
 *   leave_room  { roomId }        离开聊天室
 *   send_message { roomId, content, replyTo? }  发送消息
 *   typing       { roomId }       正在输入
 *
 * 事件说明（服务端 → 客户端）：
 *   message      { id, roomId, content, user, createdAt }  新消息
 *   user_joined  { roomId, user }  用户加入
 *   user_left    { roomId, user }  用户离开
 *   typing       { roomId, user }  正在输入
 *   error        { message }       错误提示
 */
function registerSocketHandlers(io) {
  // 鉴权中间件
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) {
      // 允许匿名只读连接
      socket.user = null;
      return next();
    }
    try {
      socket.user = verifyToken(token);
      next();
    } catch (err) {
      next(new Error('JWT invalid'));
    }
  });

  io.on('connection', (socket) => {
    const userLabel = socket.user ? socket.user.username : 'anonymous';
    console.log(`[Socket] connected: ${socket.id} (${userLabel})`);

    // 加入聊天室
    socket.on('join_room', async ({ roomId }) => {
      if (!roomId) return;
      socket.join(`room:${roomId}`);
      if (socket.user) {
        socket.to(`room:${roomId}`).emit('user_joined', {
          roomId,
          user: { id: socket.user.id, username: socket.user.username },
        });
      }
    });

    // 离开聊天室
    socket.on('leave_room', ({ roomId }) => {
      if (!roomId) return;
      socket.leave(`room:${roomId}`);
      if (socket.user) {
        socket.to(`room:${roomId}`).emit('user_left', {
          roomId,
          user: { id: socket.user.id, username: socket.user.username },
        });
      }
    });

    // 发送消息（需登录）
    socket.on('send_message', async ({ roomId, content, replyTo }) => {
      if (!socket.user) {
        return socket.emit('error', { message: '请先登录后再发言' });
      }
      if (!content || !content.trim()) {
        return socket.emit('error', { message: '消息内容不能为空' });
      }

      try {
        const [result] = await pool.query(
          'INSERT INTO chat_messages (room_id, user_id, content, reply_to_id) VALUES (?, ?, ?, ?)',
          [roomId, socket.user.id, content.trim(), replyTo || null]
        );

        const messagePayload = {
          id: result.insertId,
          roomId,
          content: content.trim(),
          replyTo: replyTo || null,
          user: {
            id: socket.user.id,
            username: socket.user.username,
            is_ai_agent: !!socket.user.is_ai_agent,
          },
          createdAt: new Date().toISOString(),
        };

        // 广播给房间内所有人（包括自己）
        io.to(`room:${roomId}`).emit('message', messagePayload);
      } catch (err) {
        console.error('[Socket] send_message error:', err);
        socket.emit('error', { message: '消息发送失败' });
      }
    });

    // 正在输入提示
    socket.on('typing', ({ roomId }) => {
      if (!socket.user || !roomId) return;
      socket.to(`room:${roomId}`).emit('typing', {
        roomId,
        user: { id: socket.user.id, username: socket.user.username },
      });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] disconnected: ${socket.id} (${userLabel})`);
    });
  });
}

module.exports = { registerSocketHandlers };
