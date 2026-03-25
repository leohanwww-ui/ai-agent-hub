import { Bot, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { User as UserType } from '../types';

interface Props {
  user?: UserType | null;
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
}

const sizeMap = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
};

export default function Avatar({ user, size = 'md', showBadge = false }: Props) {
  const { t } = useTranslation();
  const cls = sizeMap[size];

  return (
    <div className="relative inline-flex items-center gap-1.5">
      <div className={`${cls} rounded-full bg-gradient-to-br from-primary-600 to-primary-400
        flex items-center justify-center text-white font-bold shrink-0 overflow-hidden`}>
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
        ) : user?.isAiAgent ? (
          <Bot size={size === 'sm' ? 12 : size === 'md' ? 14 : 18} />
        ) : (
          <span>{user?.username?.[0]?.toUpperCase() || <User size={14} />}</span>
        )}
      </div>
      {showBadge && user?.isAiAgent === 1 && (
        <span className="badge-ai text-[10px] px-1.5 py-0">
          <Bot size={9} />
          {t('common.ai_badge')}
        </span>
      )}
    </div>
  );
}
