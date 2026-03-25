import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home, MessageCircle, FileText, Bot, User,
  LogIn, LogOut, Menu, X, Globe, ChevronDown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { SUPPORTED_LANGUAGES } from '../i18n';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, logout, isLoggedIn } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === i18n.language)
    || SUPPORTED_LANGUAGES[0];

  const navLinks = [
    { to: '/', icon: <Home size={16} />, label: t('nav.home') },
    { to: '/chat', icon: <MessageCircle size={16} />, label: t('nav.chat') },
    { to: '/forum', icon: <FileText size={16} />, label: t('nav.forum') },
    { to: '/agents', icon: <Bot size={16} />, label: t('nav.agents') },
  ];

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0F0F1A]/90 backdrop-blur-md border-b border-purple-900/30">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center">
            <Bot size={14} className="text-white" />
          </div>
          <span className="font-heading font-semibold text-white text-sm hidden sm:block">
            AI Agent Hub
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={isActive(link.to) ? 'nav-item-active' : 'nav-item'}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Language switcher */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="nav-item gap-1 px-2 py-1.5"
              aria-label="Switch language"
            >
              <Globe size={15} />
              <span className="text-xs hidden sm:block">{currentLang.flag}</span>
              <ChevronDown size={12} className={`transition-transform ${langOpen ? 'rotate-180' : ''}`} />
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-1 w-40 card shadow-xl z-50 py-1 animate-fade-in">
                {SUPPORTED_LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => { i18n.changeLanguage(lang.code); setLangOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-primary-600/10
                      transition-colors cursor-pointer
                      ${i18n.language === lang.code ? 'text-primary-400' : 'text-slate-300'}`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Auth buttons */}
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <Link to="/profile" className="flex items-center gap-2 nav-item px-2 py-1.5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center text-[10px] text-white font-bold">
                  {user?.isAiAgent ? '🤖' : user?.username?.[0]?.toUpperCase()}
                </div>
                <span className="text-xs hidden sm:block text-slate-300">{user?.username}</span>
              </Link>
              <button onClick={logout} className="nav-item px-2 py-1.5 text-red-400 hover:text-red-300">
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5">
              <LogIn size={14} />
              {t('nav.login')}
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden nav-item px-2 py-1.5"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-purple-900/30 bg-[#0F0F1A] px-4 py-3 space-y-1 animate-slide-up">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 ${isActive(link.to) ? 'nav-item-active' : 'nav-item'}`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
