import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useRef, useEffect, useState } from 'react';
import { Home, Compass, Heart, User, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import AudioPlayer from './player/AudioPlayer';
import { usePlayer } from '@/lib/PlayerContext';
import FollowRequestsBell from '@/components/notifications/FollowRequestsBell';
import { base44 } from '@/api/base44Client';

const navItems = [
  { icon: Home, label: 'Feed', path: '/' },
  { icon: Compass, label: 'Explorar', path: '/explore' },
  { icon: Heart, label: 'Curtidas', path: '/playlists' },
  { icon: User, label: 'Perfil', path: '/profile' },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentEpisode } = usePlayer();
  const tabHistory = useRef({});
  const [isAuthed, setIsAuthed] = useState(null); // null = still checking

  useEffect(() => {
    base44.auth.isAuthenticated().then(setIsAuthed).catch(() => setIsAuthed(false));
  }, []);

  const handleNavClick = (path) => {
    const active = location.pathname === path ||
      (path !== '/' && location.pathname.startsWith(path));

    if (active) {
      navigate(path, { replace: true });
    } else {
      const saved = tabHistory.current[path];
      navigate(saved || path);
    }
    const currentTab = navItems.find(n => n.path !== '/'
      ? location.pathname.startsWith(n.path)
      : location.pathname === '/');
    if (currentTab) {
      tabHistory.current[currentTab.path] = location.pathname;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background max-w-md mx-auto relative">
      <main
        className="flex-1 overflow-y-auto pb-20"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <Outlet />
      </main>

      {currentEpisode && <AudioPlayer />}
      <FollowRequestsBell />

      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md border-t border-border z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', userSelect: 'none', WebkitUserSelect: 'none', background: 'hsl(var(--card))' }}
      >
        <div className="flex items-center justify-around px-2 py-3">
          {navItems.map(({ icon: Icon, label, path }) => {
            // For protected tabs, redirect to login if not authed
            const isProtected = path === '/playlists' || path === '/profile';
            const active = location.pathname === path ||
              (path !== '/' && location.pathname.startsWith(path));

            const handleClick = () => {
              if (isProtected && isAuthed === false) {
                base44.auth.redirectToLogin(window.location.href);
                return;
              }
              handleNavClick(path);
            };

            // Show login icon for profile tab only when confirmed not authed (not while loading)
            const DisplayIcon = (path === '/profile' && isAuthed === false) ? LogIn : Icon;
            const displayLabel = (path === '/profile' && isAuthed === false) ? 'Entrar' : label;

            return (
              <button
                key={path}
                onClick={handleClick}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all duration-200 active:scale-95",
                  active ? "text-primary" : "text-muted-foreground"
                )}
                style={{ WebkitTapHighlightColor: 'transparent', background: 'none', border: 'none' }}
              >
                <div className={cn(
                  "relative",
                  active && "after:absolute after:-bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-primary"
                )}>
                  <DisplayIcon size={22} strokeWidth={active ? 2.5 : 1.8} />
                </div>
                <span className="text-xs font-medium">{displayLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}