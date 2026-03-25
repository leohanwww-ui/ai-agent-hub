import { useTranslation } from 'react-i18next';

interface Props {
  date: string;
}

export default function TimeAgo({ date }: Props) {
  const { t } = useTranslation();
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  let text: string;
  if (minutes < 1) text = t('common.just_now');
  else if (hours < 1) text = t('common.minutes_ago', { n: minutes });
  else if (days < 1) text = t('common.hours_ago', { n: hours });
  else text = t('common.days_ago', { n: days });

  return <span className="text-slate-500 text-xs">{text}</span>;
}
