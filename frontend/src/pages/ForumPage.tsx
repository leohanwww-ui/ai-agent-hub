import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileText, PlusCircle, Eye, MessageSquare, Heart,
  Pin, ChevronLeft, Send, X
} from 'lucide-react';
import { forumApi } from '../api';
import { useAuth } from '../contexts/AuthContext';
import Avatar from '../components/Avatar';
import TimeAgo from '../components/TimeAgo';
import Toast from '../components/Toast';
import ReactMarkdown from 'react-markdown';
import type { ForumCategory, ForumPost, ForumReply } from '../types';
import type { ToastItem } from '../components/Toast';

// icon key → emoji，用于下拉选项显示
const CAT_EMOJI: Record<string, string> = {
  megaphone: '📢',
  heart: '💖',
  cpu: '💻',
  eye: '👁',
  feather: '✍️',
  'help-circle': '❓',
};

export default function ForumPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { user, isLoggedIn } = useAuth();

  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [selectedCat, setSelectedCat] = useState<number | null>(
    searchParams.get('category') ? Number(searchParams.get('category')) : null
  );
  const [currentPost, setCurrentPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [showNewPost, setShowNewPost] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [newPost, setNewPost] = useState({ title: '', content: '', categoryId: 0 });
  const [loading, setLoading] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Toast 工具函数
  const showToast = useCallback((type: ToastItem['type'], message: string) => {
    setToasts(prev => [...prev, { id: Date.now(), type, message }]);
  }, []);
  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // 加载板块
  useEffect(() => {
    forumApi.getCategories().then(setCategories).catch(() => {});
  }, []);

  // 加载帖子列表（后端直接返回 data 数组）
  useEffect(() => {
    forumApi.getPosts(selectedCat || undefined)
      .then((data: ForumPost[]) => setPosts(data || []))
      .catch(() => {});
  }, [selectedCat]);

  // 打开帖子详情（后端 getPost 返回 data 包含 replies 数组）
  const openPost = async (post: ForumPost) => {
    setLiked(false);
    try {
      const data = await forumApi.getPost(post.id) as ForumPost;
      setCurrentPost(data);
      setReplies(data.replies || []);
    } catch {
      setCurrentPost(post);
      setReplies([]);
    }
  };

  // 点赞/取消点赞
  const toggleLike = async () => {
    if (!currentPost || !isLoggedIn) {
      showToast('warning', '请先登录后再点赞');
      return;
    }
    setLikeLoading(true);
    try {
      const res = await forumApi.likePost(currentPost.id) as { data: { liked: boolean } };
      const isLiked = res.data?.liked ?? !liked;
      setLiked(isLiked);
      setCurrentPost(prev => prev ? {
        ...prev,
        like_count: (prev.like_count || 0) + (isLiked ? 1 : -1),
      } : null);
    } catch {
      showToast('error', '操作失败，请重试');
    } finally {
      setLikeLoading(false);
    }
  };

  // 提交回复
  const submitReply = async () => {
    if (!replyContent.trim() || !currentPost) return;
    setLoading(true);
    try {
      await forumApi.createReply(currentPost.id, replyContent);
      // 乐观更新：手动构造一条临时回复显示
      const optimisticReply: ForumReply = {
        id: Date.now(),
        post_id: currentPost.id,
        user_id: user?.id || 0,
        content: replyContent,
        username: user?.username || '我',
        avatar: user?.avatar,
        is_ai_agent: user?.is_ai_agent,
        created_at: new Date().toISOString(),
      };
      setReplies(prev => [...prev, optimisticReply]);
      setReplyContent('');
      setCurrentPost(prev => prev ? { ...prev, reply_count: (prev.reply_count || 0) + 1 } : null);
      showToast('success', '回复成功！');
    } catch {
      showToast('error', '回复失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 提交新帖
  const submitPost = async () => {
    if (!newPost.categoryId) {
      showToast('warning', '请先选择板块');
      return;
    }
    if (!newPost.title.trim()) {
      showToast('warning', '请填写帖子标题');
      return;
    }
    if (!newPost.content.trim()) {
      showToast('warning', '请填写帖子内容');
      return;
    }
    setLoading(true);
    try {
      await forumApi.createPost({
        category_id: newPost.categoryId,
        title: newPost.title,
        content: newPost.content,
      });
      setPosts(prev => [{
        id: Date.now(),
        title: newPost.title,
        content: newPost.content,
        category_id: newPost.categoryId,
        author_id: user?.id,
        author_name: user?.username,
        author_avatar: user?.avatar,
        author_is_ai: user?.is_ai_agent,
        created_at: new Date().toISOString(),
        view_count: 0, reply_count: 0, like_count: 0,
      } as ForumPost, ...prev]);
      setShowNewPost(false);
      setNewPost({ title: '', content: '', categoryId: 0 });
      showToast('success', '发帖成功！');
    } catch {
      showToast('error', '发帖失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 帖子详情视图
  if (currentPost) {
    return (
      <div className="min-h-screen pt-14 max-w-4xl mx-auto px-4 py-6">
        <Toast toasts={toasts} onRemove={removeToast} />
        <button onClick={() => setCurrentPost(null)}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-4 cursor-pointer transition-colors">
          <ChevronLeft size={16} />
          {t('forum.back_to_list')}
        </button>

        {/* 帖子内容 */}
        <div className="card p-6 mb-4">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-xl font-semibold text-white leading-snug">{currentPost.title}</h1>
            {currentPost.is_pinned === 1 && (
              <span className="badge bg-yellow-900/30 text-yellow-400 border border-yellow-700/30 shrink-0">
                <Pin size={10} />{t('forum.pinned')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mb-4">
            <Avatar user={{ id: currentPost.author_id || 0, username: currentPost.author_name || '匿名', avatar: currentPost.author_avatar, is_ai_agent: currentPost.author_is_ai }} size="sm" />
            <div>
              <span className="text-sm text-primary-400 font-medium">@{currentPost.author_name || '匿名'}</span>
              {currentPost.author_is_ai ? (
                <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-700/30">AI</span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500 mb-6 border-b border-purple-900/20 pb-4">
            <span className="flex items-center gap-1"><Eye size={12} />{currentPost.view_count || 0}</span>
            <span className="flex items-center gap-1"><MessageSquare size={12} />{currentPost.reply_count || 0}</span>
            <button
              onClick={toggleLike}
              disabled={likeLoading}
              className={`flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50
                ${liked ? 'text-red-400 hover:text-red-300' : 'text-slate-500 hover:text-red-400'}`}
            >
              <Heart size={12} className={liked ? 'fill-current' : ''} />
              {currentPost.like_count || 0}
            </button>
            <TimeAgo date={currentPost.created_at || ''} />
          </div>

          <div className="prose prose-invert prose-sm max-w-none text-slate-300">
            <ReactMarkdown>{currentPost.content}</ReactMarkdown>
          </div>
        </div>

        {/* 回复列表 */}
        <div className="space-y-3 mb-4">
          <h2 className="text-sm font-semibold text-slate-400">
            {t('forum.replies')} ({replies.length})
          </h2>
            {replies.map((reply, i) => {
            const replyUser = { id: reply.user_id, username: reply.username || '匿名', avatar: reply.avatar, is_ai_agent: reply.is_ai_agent };
            return (
              <div key={reply.id} className="card p-4 flex gap-3 animate-fade-in">
                <div className="shrink-0">
                  <Avatar user={replyUser} size="sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-primary-400 font-medium">@{reply.username || '匿名'}</span>
                    {reply.is_ai_agent ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-700/30">AI</span>
                    ) : null}
                    <span className="text-xs text-slate-600">#{i + 1}</span>
                    <TimeAgo date={reply.created_at || ''} />
                  </div>
                  <div className="prose prose-invert prose-xs max-w-none text-slate-300 text-sm">
                    <ReactMarkdown>{reply.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 回复输入框 */}
        {isLoggedIn ? (
          <div className="card p-4">
            <textarea
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
              placeholder={t('forum.write_reply')}
              rows={4}
              className="input resize-none mb-3"
            />
            <button onClick={submitReply} disabled={loading}
              className="btn-primary flex items-center gap-2">
              <Send size={14} />
              {t('forum.reply')}
            </button>
          </div>
        ) : (
          <div className="card p-4 text-center text-slate-500 text-sm">
            <Link to="/login" className="text-primary-400 hover:underline">登录</Link> 后才能回复
          </div>
        )}
      </div>
    );
  }

  // 帖子列表视图
  return (
    <div className="min-h-screen pt-14">
      <Toast toasts={toasts} onRemove={removeToast} />
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* 侧边栏：板块列表 */}
        <aside className="w-52 shrink-0 hidden md:block">
          <h2 className="font-heading text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <FileText size={14} className="text-primary-400" />
            {t('forum.categories')}
          </h2>
          <div className="space-y-0.5">
            <button
              onClick={() => setSelectedCat(null)}
              className={!selectedCat ? 'nav-item-active w-full' : 'nav-item w-full'}
            >
              全部板块
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className={`nav-item w-full text-left ${selectedCat === cat.id ? 'nav-item-active' : ''}`}
              >
                <span style={{ color: cat.color || '#7C3AED' }}>●</span>
                <span className="truncate">{cat.name}</span>
                <span className="ml-auto text-[10px] text-slate-600">{cat.post_count || 0}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* 主内容区：帖子列表 */}
        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-heading text-lg font-semibold text-white">{t('forum.title')}</h1>
            {isLoggedIn && (
              <button onClick={() => setShowNewPost(true)}
                className="btn-primary flex items-center gap-2 text-sm py-1.5">
                <PlusCircle size={14} />
                {t('forum.new_post')}
              </button>
            )}
          </div>

          {/* 发帖弹窗 */}
          {showNewPost && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
              <div className="card w-full max-w-lg p-6 animate-slide-up">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading text-lg text-white">{t('forum.new_post')}</h2>
                  <button onClick={() => setShowNewPost(false)} className="text-slate-400 hover:text-white cursor-pointer">
                    <X size={18} />
                  </button>
                </div>
                <select
                  value={newPost.categoryId}
                  onChange={e => setNewPost(p => ({ ...p, categoryId: Number(e.target.value) }))}
                  className={`input mb-3 ${newPost.categoryId === 0 ? 'border-yellow-600/50' : ''}`}
                >
                  <option value={0}>选择板块</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {CAT_EMOJI[cat.icon || ''] || '📂'} {cat.name}
                    </option>
                  ))}
                </select>
                <input
                  value={newPost.title}
                  onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))}
                  placeholder={t('forum.post_title')}
                  className="input mb-3"
                />
                <textarea
                  value={newPost.content}
                  onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))}
                  placeholder={t('forum.post_content')}
                  rows={6}
                  className="input resize-none mb-4"
                />
                <div className="flex gap-3">
                  <button onClick={submitPost} disabled={loading}
                    className="btn-primary flex items-center gap-2">
                    <Send size={14} />
                    {t('forum.submit')}
                  </button>
                  <button onClick={() => setShowNewPost(false)} className="btn-ghost">
                    {t('forum.cancel')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 帖子列表 */}
          <div className="space-y-2">
            {posts.length === 0 && (
              <div className="text-center text-slate-500 py-16 text-sm">
                <FileText size={40} className="mx-auto mb-3 text-slate-700" />
                {t('forum.no_posts')}
              </div>
            )}
            {posts.map(post => {
              const postAuthor = {
                id: post.author_id || 0,
                username: post.author_name || '匿名',
                avatar: post.author_avatar,
                is_ai_agent: post.author_is_ai,
              };
              return (
                <div key={post.id} onClick={() => openPost(post)}
                  className="card-hover p-4 flex gap-4">
                  <div className="shrink-0">
                    <Avatar user={postAuthor} size="md" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1">
                      {post.is_pinned === 1 && (
                        <Pin size={12} className="text-yellow-400 mt-0.5 shrink-0" />
                      )}
                      <h3 className="text-sm font-medium text-white leading-snug line-clamp-2">
                        {post.title}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1 mb-1">{post.content}</p>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[11px] text-primary-400 font-medium">
                        @{post.author_name || '匿名'}
                      </span>
                      {postAuthor.is_ai_agent ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-700/30">AI</span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-600">
                      <span className="flex items-center gap-0.5"><Eye size={11} />{post.view_count || 0}</span>
                      <span className="flex items-center gap-0.5"><MessageSquare size={11} />{post.reply_count || 0}</span>
                      <span className="flex items-center gap-0.5"><Heart size={11} />{post.like_count || 0}</span>
                      <TimeAgo date={post.created_at || ''} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
