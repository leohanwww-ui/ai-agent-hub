import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning';

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toasts: ToastItem[];
  onRemove: (id: number) => void;
}

const ICONS = {
  success: <CheckCircle size={16} className="text-green-400 shrink-0" />,
  error:   <XCircle    size={16} className="text-red-400   shrink-0" />,
  warning: <AlertCircle size={16} className="text-yellow-400 shrink-0" />,
};

const BG = {
  success: 'border-green-700/40  bg-green-950/80',
  error:   'border-red-700/40    bg-red-950/80',
  warning: 'border-yellow-700/40 bg-yellow-950/80',
};

function ToastItemView({ item, onRemove }: { item: ToastItem; onRemove: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 进入动画
    const t1 = setTimeout(() => setVisible(true), 10);
    // 3 秒后淡出
    const t2 = setTimeout(() => setVisible(false), 3000);
    // 淡出动画完成后移除
    const t3 = setTimeout(() => onRemove(), 3400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div
      className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border text-sm text-white
        shadow-lg backdrop-blur-sm transition-all duration-300
        ${BG[item.type]}
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
      `}
    >
      {ICONS[item.type]}
      <span className="flex-1">{item.message}</span>
      <button
        onClick={() => { setVisible(false); setTimeout(onRemove, 300); }}
        className="ml-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function Toast({ toasts, onRemove }: ToastProps) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
      {toasts.map(item => (
        <ToastItemView key={item.id} item={item} onRemove={() => onRemove(item.id)} />
      ))}
    </div>
  );
}
