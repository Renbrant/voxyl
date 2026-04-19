import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import VoxylHeader from '@/components/common/VoxylHeader';
import PlaylistCard from '@/components/playlist/PlaylistCard';
import PodcastSearchBar from '@/components/explore/PodcastSearchBar';
import PodcastResultCard from '@/components/explore/PodcastResultCard';
import AddToPlaylistModal from '@/components/explore/AddToPlaylistModal';
import UserSearchCard from '@/components/explore/UserSearchCard';
import { Compass, Radio, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useDebounce } from '@/hooks/useDebounce';

export default function Explore() {
  const [tab, setTab] = useState('playlists');
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState('');
  const [podcastResults, setPodcastResults] = useState([]);
  const [podcastLoading, setPodcastLoading] = useState(false);
  const [selectedPodcast, setSelectedPodcast] = useState(null);
  const [voxylSearch, setVoxylSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [likes, setLikes] = useState([]);
  const [blockedIds, setBlockedIds] = useState([]);
  const [followStatuses, setFollowStatuses] = useState({}); // userId -> 'pending' | 'accepted' | null
  const [theyFollowMeIds, setTheyFollowMeIds] = useState(new Set()); // userIds who follow me

  const debouncedQuery = useDebounce(search, 600);
  const debouncedUserSearch = useDebounce(userSearch, 400);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      Promise.all([
        base44.entities.Block.filter({ blocker_id: u.id }),
        base44.entities.Block.filter({ blocked_id: u.id }),
      ]).then(([myBlocks, theirBlocks]) => {
        const ids = [
          ...myBlocks.map(b => b.blocked_id),
          ...theirBlocks.map(b => b.blocker_id),
        ];
        setBlockedIds([...new Set(ids)]);
      }).catch(() => {});
      base44.entities.Follow.filter({ follower_id: u.id })
        .then(follows => {
          const map = {};
          follows.forEach(f => { map[f.following_id] = f.status; });
          setFollowStatuses(map);
        })
        .catch(() => {});
      base44.entities.Follow.filter({ following_id: u.id, status: 'accepted' })
        .then(follows => {
          setTheyFollowMeIds(new Set(follows.map(f => f.follower_id)));
        })
        .catch(() => {});
    }).catch(() => {});
  }, []);

  useQuery({
    queryKey: ['my-likes', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const l = await base44.entities.PlaylistLike.filter({ user_id: user.id });
      setLikes(l.map(x => x.playlist_id));
      return l;
    },
  });

  const handleLike = async (playlist) => {
    if (!user) return;
    const liked = likes.includes(playlist.id);
    if (liked) {
      const records = await base44.entities.PlaylistLike.filter({ playlist_id: playlist.id, user_id: user.id });
      if (records[0]) await base44.entities.PlaylistLike.delete(records[0].id);
      setLikes(prev => prev.filter(id => id !== playlist.id));
      await base44.entities.Playlist.update(playlist.id, { likes_count: Math.max(0, (playlist.likes_count || 1) - 1) });
    } else {
      await base44.entities.PlaylistLike.create({ playlist_id: playlist.id, user_id: user.id, user_email: user.email });
      setLikes(prev => [...prev, playlist.id]);
      await base44.entities.Playlist.update(playlist.id, { likes_count: (playlist.likes_count || 0) + 1 });
    }
  };

  // Fetch Voxyl playlists
  const { data: playlists = [], isLoading: playlistsLoading } = useQuery({
    queryKey: ['explore-playlists'],
    queryFn: () => base44.entities.Playlist.list('-created_date', 100).then(all => all.filter(p => !p.visibility || p.visibility === 'public')),
  });

  // Fetch all users for search
  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['explore-users', debouncedUserSearch],
    enabled: tab === 'users',
    queryFn: () => base44.functions.invoke('searchUsers', { query: debouncedUserSearch }).then(r => r.data?.users || []),
  });

  // Podcast Index search
  useEffect(() => {
    if (tab !== 'podcasts') return;
    if (!debouncedQuery.trim()) { setPodcastResults([]); return; }
    setPodcastLoading(true);
    const maxDuration = user?.max_duration || 0;
    base44.functions.invoke('searchPodcasts', { query: debouncedQuery, maxDuration })
      .then(res => {
        setPodcastResults(res.data?.results || []);
        setPodcastLoading(false);
      })
      .catch(() => setPodcastLoading(false));
  }, [debouncedQuery, tab, user]);

  const filteredPlaylists = playlists.filter(p => {
    if (blockedIds.includes(p.creator_id)) return false;
    return !voxylSearch ||
      p.name?.toLowerCase().includes(voxylSearch.toLowerCase()) ||
      p.description?.toLowerCase().includes(voxylSearch.toLowerCase()) ||
      p.creator_name?.toLowerCase().includes(voxylSearch.toLowerCase());
  });

  const filteredUsers = allUsers;

  const TABS = [
    { key: 'playlists', label: 'Playlists', icon: Compass },
    { key: 'users', label: 'Usuários', icon: Users },
    { key: 'podcasts', label: 'Podcasts', icon: Radio },
  ];

  return (
    <div className="min-h-screen bg-background">
      <VoxylHeader title="Explorar" subtitle="Descubra podcasts e playlists" />

      {/* Tabs */}
      <div className="flex gap-2 px-4 mb-4 overflow-x-auto no-scrollbar">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all flex-shrink-0",
              tab === key
                ? "gradient-primary text-white glow-primary"
                : "bg-secondary text-muted-foreground"
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="px-4 mb-4">
        {tab === 'playlists' && <PodcastSearchBar value={voxylSearch} onChange={setVoxylSearch} loading={false} />}
        {tab === 'podcasts' && <PodcastSearchBar value={search} onChange={setSearch} loading={podcastLoading} />}
        {tab === 'users' && <PodcastSearchBar value={userSearch} onChange={setUserSearch} loading={usersLoading} />}
      </div>

      <div className="px-4 pb-4">
        {/* Playlists tab */}
        {tab === 'playlists' && (
          playlistsLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-secondary animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPlaylists.map((pl, i) => (
                <motion.div key={pl.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <PlaylistCard playlist={pl} compact liked={likes.includes(pl.id)} onLike={handleLike} currentUser={user} onBlocked={id => setBlockedIds(prev => [...prev, id])} />
                </motion.div>
              ))}
              {filteredPlaylists.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <p className="text-4xl mb-3">🔍</p>
                  <p>Nenhum resultado encontrado</p>
                </div>
              )}
            </div>
          )
        )}

        {/* Users tab */}
        {tab === 'users' && (
          usersLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-secondary animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <p className="text-4xl mb-3">👤</p>
                  <p>{debouncedUserSearch ? `Nenhum usuário encontrado para "${debouncedUserSearch}"` : 'Nenhum usuário encontrado'}</p>
                </div>
              ) : (
                filteredUsers.map((u, i) => (
                  <UserSearchCard
                    key={u.id}
                    user={u}
                    index={i}
                    currentUser={user}
                    followStatus={followStatuses[u.id] || null}
                    theyFollowMe={theyFollowMeIds.has(u.id)}
                    onStatusChange={(status) =>
                      setFollowStatuses(prev => ({ ...prev, [u.id]: status }))
                    }
                  />
                ))
              )}
            </div>
          )
        )}

        {/* Podcasts tab */}
        {tab === 'podcasts' && (
          <div className="space-y-2">
            {!search.trim() && !podcastLoading && podcastResults.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-5xl mb-4">🎙️</p>
                <p className="font-medium text-foreground">Busque qualquer podcast</p>
                <p className="text-sm mt-1">Resultados de todo o mundo via Podcast Index</p>
              </div>
            )}
            {podcastLoading && (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-secondary animate-pulse" />)}
              </div>
            )}
            {!podcastLoading && podcastResults.map((podcast, i) => (
              <PodcastResultCard key={podcast.id} podcast={podcast} index={i} onAdd={setSelectedPodcast} />
            ))}
            {!podcastLoading && search.trim() && podcastResults.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-4xl mb-3">🔍</p>
                <p>Nenhum podcast encontrado para "{search}"</p>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedPodcast && (
        <AddToPlaylistModal
          podcast={selectedPodcast}
          onClose={() => setSelectedPodcast(null)}
        />
      )}
    </div>
  );
}