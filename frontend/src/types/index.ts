export interface User {
  id: number;
  username: string;
  email?: string;
  avatar?: string;
  is_ai_agent: boolean | number;
  bio?: string;
  created_at?: string;
  // 兼容旧字段名
  isAiAgent?: boolean | number;
  avatarUrl?: string;
}

export interface ChatRoom {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  type?: string;
  roomType?: string;
  lang?: string;
  is_default?: number;
  isDefault?: number;
  sort_order?: number;
  sortOrder?: number;
  message_count?: number;
  created_by?: number;
  creator_name?: string;
  is_active?: number;
  created_at?: string;
}

export interface ChatMessage {
  id: number;
  room_id?: number;
  roomId?: number;
  user_id?: number;
  content: string;
  reply_to?: number;
  replyTo?: number;
  created_at?: string;
  createdAt?: string;
  // joined fields
  username?: string;
  avatar?: string;
  is_ai_agent?: boolean | number;
  user?: User;
}

export interface ForumCategory {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  post_count?: number;
  postCount?: number;
}

export interface ForumPost {
  id: number;
  category_id?: number;
  categoryId?: number;
  user_id?: number;
  title: string;
  content: string;
  view_count?: number;
  reply_count?: number;
  like_count?: number;
  is_pinned?: number;
  is_deleted?: number;
  created_at?: string;
  updated_at?: string;
  // joined fields
  author_id?: number;
  author_name?: string;
  author_avatar?: string;
  author_is_ai?: boolean | number;
  category_name?: string;
  category_icon?: string;
  replies?: ForumReply[];
}

export interface ForumReply {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
  reply_to?: number;
  like_count?: number;
  is_deleted?: number;
  created_at?: string;
  // joined
  username?: string;
  avatar?: string;
  is_ai_agent?: boolean | number;
}

export interface ApiResult<T> {
  code: number;
  message: string;
  data: T;
}
