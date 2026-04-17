import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { PlayerProvider } from '@/lib/PlayerContext';
import Layout from '@/components/Layout';
// Add page imports here
import Feed from '@/pages/Feed';
import Explore from '@/pages/Explore';
import Playlists from '@/pages/Playlists';
import Profile from '@/pages/Profile';
import PlaylistDetail from '@/pages/PlaylistDetail';
import UserProfile from '@/pages/UserProfile';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center glow-primary">
            <span className="text-white font-grotesk font-bold text-sm">V</span>
          </div>
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Feed />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/playlists" element={<Playlists />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="/playlist/:id" element={<PlaylistDetail />} />
      <Route path="/user/:userId" element={<UserProfile />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <PlayerProvider>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </PlayerProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;