import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Moon, Sun, Eye, Ban, LogOut, Trash2, Shield, UserX } from 'lucide-react';
import VoxylHeader from '@/components/common/VoxylHeader';
import DeleteAccountModal from '@/components/profile/DeleteAccountModal';
import BlockedUsersModal from '@/components/profile/BlockedUsersModal';
import { motion, AnimatePresence } from 'framer-motion';

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [showBlocked, setShowBlocked] = useState(false);
  const [blockedCount, setBlockedCount] = useState(0);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      // Check for dark mode preference
      const isDark = localStorage.getItem('darkMode') !== 'false';
      setDarkMode(isDark);
    }).catch(() => {});
  }, []);

  const handleThemeChange = (isDark) => {
    setDarkMode(isDark);
    localStorage.setItem('darkMode', isDark ? 'true' : 'false');
    // Apply theme to document
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = () => {
    base44.auth.logout('/');
  };

  const menuItems = [
    {
      icon: darkMode ? Moon : Sun,
      label: 'Tema',
      description: darkMode ? 'Modo escuro ativado' : 'Modo claro ativado',
      action: () => handleThemeChange(!darkMode),
      badge: null,
    },
    {
      icon: Eye,
      label: 'Privacidade do Perfil',
      description: user?.profile_hidden ? 'Seu perfil está oculto' : 'Seu perfil é visível',
      action: () => {
        if (!user) return;
        const newVal = !user.profile_hidden;
        base44.auth.updateMe({ profile_hidden: newVal });
        base44.entities.Playlist.filter({ creator_id: user.id }).then(playlists => {
          Promise.all(playlists.map(p => base44.entities.Playlist.update(p.id, { creator_hidden: newVal })));
        });
        setUser(prev => ({ ...prev, profile_hidden: newVal }));
      },
      badge: user?.profile_hidden ? 'Oculto' : null,
    },
    {
      icon: Ban,
      label: 'Usuários Bloqueados',
      description: `${blockedCount} usuário${blockedCount !== 1 ? 's' : ''} bloqueado${blockedCount !== 1 ? 's' : ''}`,
      action: () => setShowBlocked(true),
      badge: blockedCount > 0 ? blockedCount : null,
    },
    {
      icon: Shield,
      label: 'Política de Privacidade',
      description: 'Leia nossa política',
      action: () => navigate('/privacy'),
      badge: null,
    },
  ];

  const dangerItems = [
    {
      icon: LogOut,
      label: 'Sair da Conta',
      description: 'Você será desconectado',
      action: handleLogout,
      color: 'text-orange-400',
    },
    {
      icon: Trash2,
      label: 'Excluir Conta',
      description: 'Ação irreversível',
      action: () => setShowDelete(true),
      color: 'text-destructive',
    },
  ];

  return (
    <div className="bg-background pb-24">
      <VoxylHeader 
        title="Configurações"
        right={
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-secondary transition-colors"
          >
            <ChevronLeft size={20} className="text-primary" />
          </button>
        }
      />

      <div className="px-4">
        {/* Theme and Privacy Settings */}
        <div className="space-y-2 mb-6">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={idx}
                onClick={item.action}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl bg-secondary border border-border hover:border-primary/30 transition-colors active:scale-95"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-primary" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-semibold text-sm text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                {item.badge && (
                  <span className="px-2.5 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold flex-shrink-0">
                    {item.badge}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Danger Zone */}
        <div className="space-y-2 mt-8 pt-6 border-t border-border">
          <p className="text-xs font-semibold text-destructive/70 px-4 mb-3 uppercase tracking-wide">Zona de Perigo</p>
          {dangerItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={idx}
                onClick={item.action}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (menuItems.length + idx) * 0.05 }}
                className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl bg-secondary border border-border hover:border-destructive/30 hover:bg-destructive/5 transition-colors active:scale-95"
              >
                <div className={`w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 ${item.color}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 text-left">
                  <p className={`font-semibold text-sm ${item.color}`}>{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {showDelete && user && (
          <DeleteAccountModal user={user} onClose={() => setShowDelete(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showBlocked && user && (
          <BlockedUsersModal 
            user={user} 
            onClose={() => setShowBlocked(false)}
            onCountChange={setBlockedCount}
          />
        )}
      </AnimatePresence>
    </div>
  );
}