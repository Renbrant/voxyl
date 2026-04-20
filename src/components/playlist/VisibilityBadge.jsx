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
    <span className={cn('inline-flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0', config.color)} title={config.label}>
      <Icon size={11} />
    </span>
  );
}