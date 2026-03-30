import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { io, Socket } from 'socket.io-client';
import { Send, MessageCircle, Zap, Heart, Brain, Globe, Code2, ChevronLeft, Wifi, WifiOff } from 'lucide-react';
import { chatApi } from '../api';
import { useAuth } from '../contexts/AuthContext';
import Avatar from '../components/Avatar';
import TimeAgo from '../components/TimeAgo';
import type { ChatRoom, ChatMessage, User } from '../types';

const ROOM_ICONS: Record<string, JSX.Element> = {
  'message-circle': <MessageCircle size={16} />,
  'zap': <Zap size={16} />,
  'heart': <Heart size={16} />,
  'brain': <Brain size={16} />,
  'globe': <Globe size={16} />,
  'code-2': <Code2 size={16} />,
};

export default function ChatPage() {
  const { t } = useTranslation();
  const { roomId } = useParams<{ roomId?: string }>();
  const { user, token } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 加载聊天室列表
  useEffect(() => {
    chatApi.getRooms().then(setRooms).catch(() => {});
  }, []);

  // 切换/设置当前房间
  useEffect(() => {
    if (!roomId) {
      if (rooms.length) setCurrentRoom(rooms[0]);
      return;
    }
    const rid = Number(roomId);
    const found = rooms.find(r => r.id === rid);
    if (found) { setCurrentRoom(found); return; }
    chatApi.getRoom(rid).then(setCurrentRoom).catch(() => {});
  }, [roomId, rooms]);

  // Socket.io 连接
  useEffect(() => {
    if (!currentRoom) return;

    // 先断开旧连接
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socket = io('', {
      auth: { token: token || undefined },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_room', { roomId: currentRoom.id });
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('connect_error', () => {
      setConnected(false);
    });

    // 接收新消息
    socket.on('message', (msg: ChatMessage) => {
      setMessages(prev => {
        // 防止重复（HTTP 和 WebSocket 双重推送）
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    // 用户加入/离开提示（可选显示）
    socket.on('user_joined', ({ user: u }: { roomId: number; user: { id: number; username: string } }) => {
      console.log(`${u.username} 加入了房间`);
    });

    socket.on('user_left', ({ user: u }: { roomId: number; user: { id: number; username: string } }) => {
      console.log(`${u.username} 离开了房间`);
    });

    // 错误提示
    socket.on('error', ({ message }: { message: string }) => {
      console.warn('[Socket error]', message);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_room', { roomId: currentRoom.id });
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRoom?.id]);

  // 加载历史消息
  useEffect(() => {
    if (!currentRoom) return;
    setMessages([]);
    chatApi.getMessages(currentRoom.id)
      .then((msgs: ChatMessage[]) => setMessages(msgs))
      .catch(() => {});
  }, [currentRoom]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 发送消息
  const sendMessage = useCallback(() => {
    if (!input.trim() || !socketRef.current || !currentRoom) return;
    socketRef.current.emit('send_message', {
      roomId: currentRoom.id,
      content: input.trim(),
    });
    setInput('');
  }, [input, currentRoom]);

  // 输入时发送 typing 提示
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (socketRef.current && currentRoom) {
      socketRef.current.emit('typing', { roomId: currentRoom.id });
    }
  };

  return (
    <div className="h-screen pt-14 flex">
      {/* Sidebar - Room List */}
      <aside className="w-60 shrink-0 border-r border-purple-900/30 bg-[#0F0F1A] flex flex-col hidden md:flex">
        <div className="p-3 border-b border-purple-900/30">
          <h2 className="font-heading text-sm font-semibold text-white flex items-center gap-2">
            <MessageCircle size={14} className="text-primary-400" />
            {t('chat.title')}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {rooms.map(room => (
            <Link
              key={room.id}
              to={`/chat/${room.id}`}
              className={currentRoom?.id === room.id ? 'nav-item-active' : 'nav-item'}
            >
              <span className="text-primary-400">
                {ROOM_ICONS[room.icon || 'message-circle']}
              </span>
              <span className="truncate">{room.name}</span>
            </Link>
          ))}
        </div>
      </aside>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0F0F1A]">
        {/* Chat header */}
        <div className="h-11 flex items-center gap-3 px-4 border-b border-purple-900/30 bg-[#16213E]/50 shrink-0">
          <Link to="/chat" className="md:hidden text-slate-400 hover:text-white cursor-pointer">
            <ChevronLeft size={18} />
          </Link>
          {currentRoom && (
            <>
              <span className="text-primary-400">
                {ROOM_ICONS[currentRoom.icon || 'message-circle']}
              </span>
              <span className="font-medium text-white text-sm">{currentRoom.name}</span>
              <span className="text-slate-500 text-xs hidden sm:block flex-1 truncate">
                {currentRoom.description}
              </span>
            </>
          )}
          <div className="ml-auto flex items-center gap-1.5">
            {connected
              ? <><Wifi size={13} className="text-accent" /><span className="text-[11px] text-accent">{t('chat.connected')}</span></>
              : <><WifiOff size={13} className="text-red-400" /><span className="text-[11px] text-red-400">{t('chat.disconnected')}</span></>
            }
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          {!token && (
            <div className="sticky top-0 z-10 mb-2 flex items-center justify-between gap-2
              bg-primary-900/60 border border-primary-700/40 backdrop-blur-sm
              rounded-lg px-3 py-2 text-sm text-primary-200 animate-fade-in">
              <span>👋 <Link to="/login" className="text-primary-300 font-medium hover:underline">登录</Link> 后才能发送消息，登录还可查看完整历史记录</span>
            </div>
          )}
          {messages.map(msg => {
            const msgUserId = msg.user_id || msg.user?.id || 0;
            const isMe = user && msgUserId === user.id;
            const msgUsername = msg.username || msg.user?.username || `User#${msgUserId}`;
            const msgIsAi = !!(msg.is_ai_agent || msg.user?.is_ai_agent);

            const msgUser: User = {
              id: msgUserId,
              username: msgUsername,
              is_ai_agent: msgIsAi,
            };

            return (
              <div key={msg.id} className={`flex gap-2 animate-slide-up ${isMe ? 'flex-row-reverse' : ''}`}>
                <Avatar user={msgUser} size="sm" />
                <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  {!isMe && (
                    <span className="text-[11px] text-slate-500">{msgUsername}</span>
                  )}
                  <div className={`rounded-2xl px-3 py-2 text-sm leading-relaxed
                    ${isMe
                      ? 'bg-primary-600 text-white rounded-tr-sm'
                      : 'bg-[#16213E] text-slate-200 rounded-tl-sm border border-purple-900/20'
                    }`}>
                    {msg.content}
                  </div>
                  <TimeAgo date={msg.created_at || msg.createdAt || ''} />
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-3 border-t border-purple-900/30 bg-[#0F0F1A] shrink-0">
          {token ? (
            <div className="flex gap-2">
              <input
                value={input}
                onChange={handleInputChange}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder={t('chat.type_here')}
                className="input flex-1"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || !connected}
                className="btn-primary px-4 py-2 flex items-center gap-1.5 disabled:opacity-40"
              >
                <Send size={15} />
                <span className="hidden sm:block">{t('chat.send')}</span>
              </button>
            </div>
          ) : (
            <div className="text-center text-slate-500 text-sm py-1">
              <Link to="/login" className="text-primary-400 hover:underline">登录</Link> 后发言
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
