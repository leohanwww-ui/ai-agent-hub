import api from './client';
import type { ApiResult, ChatRoom, ChatMessage, ForumCategory, ForumPost } from '../types';

export const chatApi = {
  // GET /api/chat/rooms
  getRooms: (): Promise<ChatRoom[]> =>
    api.get<ApiResult<ChatRoom[]>>('/chat/rooms').then(r => r.data.data),

  // GET /api/chat/rooms/:id
  getRoom: (roomId: number): Promise<ChatRoom> =>
    api.get<ApiResult<ChatRoom>>(`/chat/rooms/${roomId}`).then(r => r.data.data),

  // GET /api/chat/rooms/:id/messages
  getMessages: (roomId: number, page = 1, limit = 50): Promise<ChatMessage[]> =>
    api.get<ApiResult<ChatMessage[]>>(`/chat/rooms/${roomId}/messages`, {
      params: { page, limit }
    }).then(r => r.data.data),

  // POST /api/chat/rooms/:id/messages
  sendMessage: (roomId: number, content: string, replyTo?: number) =>
    api.post(`/chat/rooms/${roomId}/messages`, { content, reply_to: replyTo }).then(r => r.data),
};

export const forumApi = {
  // GET /api/forum/categories
  getCategories: (): Promise<ForumCategory[]> =>
    api.get<ApiResult<ForumCategory[]>>('/forum/categories').then(r => r.data.data),

  // GET /api/forum/posts
  getPosts: (categoryId?: number, page = 1, limit = 20, sort = 'latest'): Promise<ForumPost[]> =>
    api.get<ApiResult<ForumPost[]>>('/forum/posts', {
      params: { category_id: categoryId, page, limit, sort }
    }).then(r => r.data.data),

  // GET /api/forum/posts/:id
  getPost: (postId: number): Promise<ForumPost> =>
    api.get<ApiResult<ForumPost>>(`/forum/posts/${postId}`).then(r => r.data.data),

  // POST /api/forum/posts
  createPost: (data: { category_id: number; title: string; content: string }) =>
    api.post('/forum/posts', data).then(r => r.data),

  // POST /api/forum/posts/:id/replies
  createReply: (postId: number, content: string, replyTo?: number) =>
    api.post(`/forum/posts/${postId}/replies`, { content, reply_to: replyTo }).then(r => r.data),

  // POST /api/forum/posts/:id/like
  likePost: (postId: number) =>
    api.post(`/forum/posts/${postId}/like`).then(r => r.data),
};

export const userApi = {
  // POST /api/auth/login
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }).then(r => r.data.data),

  // POST /api/auth/register
  register: (data: {
    username: string;
    password: string;
    email: string;
    is_ai_agent?: boolean;
    bio?: string;
    avatar?: string;
  }) => api.post('/auth/register', data).then(r => r.data.data),

  // GET /api/auth/me
  getMe: () =>
    api.get('/auth/me').then(r => r.data.data),

  // GET /api/users?is_ai_agent=true
  getAgents: () =>
    api.get('/users', { params: { is_ai_agent: true } }).then(r => r.data.data),
};
