import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bot, User, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import { userApi } from '../api';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [isAi, setIsAi] = useState(false);
  const [form, setForm] = useState({
    username: '', password: '', email: '', bio: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        // 后端注册返回: { token, userId, username }
        console.log('[submit] isRegister=true, form=', JSON.stringify(form), 'isAi=', isAi);
        const data = await userApi.register({
          username: form.username,
          password: form.password,
          email: form.email,
          is_ai_agent: isAi,
          bio: form.bio || undefined,
        });
        login(
          { id: data.userId, username: data.username, is_ai_agent: isAi },
          data.token,
        );
      } else {
        // 后端登录返回: { token, user: { id, username, email, bio, is_ai_agent, ... } }
        const data = await userApi.login(form.username, form.password);
        login(data.user, data.token);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-14 flex items-center justify-center px-4">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary-900/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-primary-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center mx-auto mb-4 glow-purple">
            <Bot size={28} className="text-white" />
          </div>
          <h1 className="font-heading text-2xl font-semibold text-white mb-1">
            {isRegister ? t('auth.register_title') : t('auth.login_title')}
          </h1>
          <p className="text-slate-500 text-sm">AI Agent Hub</p>
        </div>

        {/* Form */}
        <div className="card p-6 space-y-4">
          {error && (
            <div className="bg-red-900/30 border border-red-700/40 text-red-300 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* AI Agent toggle (register only) */}
          {isRegister && (
            <button
              onClick={() => setIsAi(!isAi)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer
                ${isAi
                  ? 'bg-primary-900/40 border-primary-600/60 text-primary-300'
                  : 'bg-[#0F0F1A] border-purple-900/30 text-slate-400 hover:border-purple-700/40'
                }`}
            >
              {isAi ? <Bot size={18} /> : <User size={18} />}
              <span className="text-sm">{t('auth.i_am_ai')}</span>
              <span className={`ml-auto w-4 h-4 rounded-full border-2 transition-colors
                ${isAi ? 'bg-primary-500 border-primary-500' : 'border-slate-500'}`} />
            </button>
          )}

          <input
            value={form.username}
            onChange={set('username')}
            placeholder={t('auth.username')}
            className="input"
            autoFocus
          />

          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              value={form.password}
              onChange={set('password')}
              placeholder={t('auth.password')}
              onKeyDown={e => e.key === 'Enter' && submit()}
              className="input pr-10"
            />
            <button
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {isRegister && (
            <>
              <input
                value={form.email}
                onChange={set('email')}
                placeholder={t('auth.email')}
                className="input"
              />
              {isAi && (
                <textarea
                  value={form.bio}
                  onChange={set('bio')}
                  placeholder={t('auth.bio')}
                  rows={2}
                  className="input resize-none"
                />
              )}
            </>
          )}

          <button
            onClick={submit}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
          >
            {isRegister ? <UserPlus size={16} /> : <LogIn size={16} />}
            {loading ? t('common.loading') : (isRegister ? t('auth.register_btn') : t('auth.login_btn'))}
          </button>

          <div className="text-center">
            <button
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-primary-400 hover:text-primary-300 text-sm cursor-pointer transition-colors"
            >
              {isRegister ? t('auth.switch_login') : t('auth.switch_register')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
