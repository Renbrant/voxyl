import { Outlet, useLocation, Link } from 'react-router-dom';
import { Home, Compass, ListMusic, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import AudioPlayer from './player/AudioPlayer';
import { usePlayer } from '@/lib/PlayerContext';

const navItems = [
  { icon: Home, label: 'Feed', path: '/' },
  { icon: Compass, label: 'Explorar', path: '/explore' },
  { icon: ListMusic, label: 'Playlists', path: '/playlists' },
  { icon: User, label: 'Perfil', path: '/profile' },
];

export default function Layout() {
  const location = useLocation();
  const { currentEpisode } = usePlayer();

  return (
    <div className="flex flex-col min-h-screen bg-background max-w-md mx-auto relative">
      <main className={cn(
        "flex-1 overflow-y-auto",
        currentEpisode ? "pb-48" : "pb-20"
      )}>
        <Outlet />
      </main>

      {currentEpisode && <AudioPlayer />}

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md glass border-t border-border z-50 select-none"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-around px-2 py-3">
          {navItems.map(({ icon: Icon, label, path }) => {
            const active = location.pathname === path || 
              (path !== '/' && location.pathname.startsWith(path));
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all duration-200",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn(
                  "relative",
                  active && "after:absolute after:-bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-primary"
                )}>
                  <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                </div>
                <span className="text-xs font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}