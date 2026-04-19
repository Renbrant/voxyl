import { Globe, Lock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function VisibilityBadge({ visibility }) {
  const configs = {
    public: {
      icon: Globe,
      label: 'Pública',
      color: 'bg-primary/10 text-primary',
    },
    friends_only: {
      icon: Users,
      label: 'Seguidores',
      color: 'bg-accent/10 text-accent',
    },
    private: {
      icon: Lock,
      label: 'Privada',
      color: 'bg-muted text-muted-foreground',
    },
  };

  const config = configs[visibility] || configs.public;
  const Icon = config.icon;

  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', config.color)}>
      <Icon size={12} />
      {config.label}
    </span>
  );
}