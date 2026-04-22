import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import VoxylHeader from '@/components/common/VoxylHeader';
import PlaylistCard from '@/components/playlist/PlaylistCard';
import PullToRefreshIndicator from '@/components/common/PullToRefreshIndicator';
import { Flame, Sparkles, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { getCache, setCache, invalidateCache, TTL_5MIN } from '@/lib/appCache';

export default function Feed() {
  const [user, setUser] = useState(null);
  const [likes, setLikes] = useState([]);
  const [blockedIds, setBlockedIds] = useState([]);
  const [followingIds, setFollowingIds] = useState(new Set());
  const [tab, setTab] = useState('trending');
  const [expandedPlaylists, setExpandedPlaylists] = useState(false);
  const [expandedPodcasts, setExpandedPodcasts] = useState(false);
  const containerRef = useRef(null);
  const queryClient = useQueryClient();

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
      base44.entities.Follow.filter({ follower_id: u.id, status: 'accepted' })
        .then(follows => setFollowingIds(new Set(follows.map(f => f.following_id))))
        .catch(() => {});
    }).catch(() => {});
  }, []);

  const { pullProgress, refreshing } = usePullToRefresh(() => {
    invalidateCache('feed-playlists');
    invalidateCache(`my-likes-${user?.id}`);
    queryClient.invalidateQueries({ queryKey: ['feed-playlists'] });
    queryClient.invalidateQueries({ queryKey: ['my-likes'] });
    queryClient.invalidateQueries({ queryKey: ['top-podcasts'] });
  }, containerRef);

  const { data: playlists = [], isLoading } = useQuery({
    queryKey: ['feed-playlists'],
    queryFn: async () => {
      const cached = getCache('feed-playlists');
      if (cached) return cached;
      const data = await base44.entities.Playlist.list('-plays_count', 100);
      setCache('feed-playlists', data, TTL_5MIN);
      return data;
    },
    initialData: () => getCache('feed-playlists') || undefined,
  });

  const { data: likedIds = [] } = useQuery({
    queryKey: ['my-likes', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const cacheKey = `my-likes-${user.id}`;
      const cached = getCache(cacheKey);
      if (cached) { setLikes(cached); return cached; }
      const l = await base44.entities.PlaylistLike.filter({ user_id: user.id });
      const ids = l.map(x => x.playlist_id);
      setLikes(ids);
      setCache(cacheKey, ids, TTL_5MIN);
      return ids;
    },
    initialData: () => {
      const cached = user ? getCache(`my-likes-${user.id}`) : null;
      if (cached) { setLikes(cached); return cached; }
      return undefined;
    },
  });

  const { data: topPodcasts = [] } = useQuery({
    queryKey: ['top-podcasts'],
    queryFn: async () => {
      // Get unique podcasts (feeds) and count their plays from PodcastPlay
      const allPlays = await base44.asServiceRole.entities.PodcastPlay.list('-created_date', 1000);
      
      const feedMap = {};
      allPlays.forEach(play => {
        if (!play.feed_url) return;
        
        if (!feedMap[play.feed_url]) {
          feedMap[play.feed_url] = {
            feedUrl: play.feed_url,
            title: play.podcast_title || 'Sem título',
            image: play.podcast_image || '',
            author: play.podcast_title || '',
            description: '',
            playCount: 0
          };
        }
        feedMap[play.feed_url].playCount += 1;
      });

      const sorted = Object.values(feedMap)
        .sort((a, b) => b.playCount - a.playCount)
        .slice(0, 100);
      
      return sorted;
    },
  });

  const handleLike = async (playlist) => {
    if (!user) return;
    const liked = likes.includes(playlist.id);
    setLikes(prev => liked ? prev.filter(id => id !== playlist.id) : [...prev, playlist.id]);
    await base44.functions.invoke('togglePlaylistLike', { playlist_id: playlist.id });
  };

  const visiblePlaylists = playlists.filter(p => {
    if (blockedIds.includes(p.creator_id)) return false;
    if (!p.visibility || p.visibility === 'public') return true;
    if (p.visibility === 'friends_only') return user && followingIds.has(p.creator_id);
    return false;
  });

  const sortedPlaylists = tab === 'trending'
    ? [...visiblePlaylists].sort((a, b) => (b.plays_count || 0) - (a.plays_count || 0))
    : [...visiblePlaylists].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const heroPlaylist = sortedPlaylists[0];
  const trendingPlaylists = sortedPlaylists.slice(1);
  const displayedTrendingPlaylists = expandedPlaylists ? trendingPlaylists : trendingPlaylists.slice(0, 8);
  const displayedPodcasts = expandedPodcasts ? topPodcasts : topPodcasts.slice(0, 8);

  return (
    <div ref={containerRef} className="bg-background relative">
      <PullToRefreshIndicator pullProgress={pullProgress} refreshing={refreshing} />
      <VoxylHeader
        subtitle="Descubra"
        title={<span className="text-gradient font-grotesk">Voxyl</span>}
      />

      {/* Tabs */}
      <div className="flex gap-2 px-4 mb-4">
        {[
          { key: 'trending', label: 'Em Alta', icon: Flame },
          { key: 'recent', label: 'Recentes', icon: Sparkles },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all",
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

      {/* Hero Playlist */}
      {!isLoading && heroPlaylist && (
        <div className="px-4 mb-5">
          <Link to={`/playlist/${heroPlaylist.id}`}>
            <div className="relative rounded-3xl overflow-hidden h-48 bg-gradient-to-br from-purple-800 via-primary/60 to-cyan-600">
              {heroPlaylist.cover_image && (
                <img src={heroPlaylist.cover_image} alt="" className="absolute inset-0 w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-xs text-white/70 mb-0.5 font-medium">🔥 Mais tocada agora</p>
                  <h2 className="text-xl font-grotesk font-bold text-white truncate">{heroPlaylist.name}</h2>
                  <p className="text-sm text-white/70 truncate">por {heroPlaylist.creator_username ? `@${heroPlaylist.creator_username}` : 'Usuário'} • {heroPlaylist.plays_count || 0} plays</p>
                </div>
                <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center glow-primary flex-shrink-0">
                  <Play size={20} fill="white" className="text-white ml-0.5" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Content Grid */}
      <div className="px-4 pb-24">
        {/* Playlists em Alta */}
        <div>
          <h2 className="text-base font-semibold mb-3 text-foreground">Playlists em Alta</h2>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-52 rounded-2xl bg-secondary animate-pulse" />
              ))}
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {displayedTrendingPlaylists.map((pl, i) => (
                  <motion.div key={pl.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <PlaylistCard playlist={pl} liked={likes.includes(pl.id)} onLike={handleLike} currentUser={user} onBlocked={id => setBlockedIds(prev => [...prev, id])} />
                  </motion.div>
                ))}
              </div>

              {/* Expand Playlists */}
              {trendingPlaylists.length > 8 && (
                <motion.button
                  onClick={() => setExpandedPlaylists(!expandedPlaylists)}
                  className="w-full py-3 rounded-2xl bg-secondary hover:bg-secondary/80 text-foreground font-medium transition-colors text-sm mb-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {expandedPlaylists ? '← Ver menos' : '+ Ver mais'}
                </motion.button>
              )}
            </div>
          )}
        </div>

        {/* Podcasts em Alta */}
         {topPodcasts.length > 0 && (
           <div>
             <h2 className="text-base font-semibold mb-3 text-foreground">Podcasts em Alta</h2>

             {/* Hero Podcast */}
             {topPodcasts[0] && (
               <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-5 relative rounded-3xl overflow-hidden h-48 bg-gradient-to-br from-purple-800 via-primary/60 to-cyan-600">
                 {topPodcasts[0].image && (
                   <img src={topPodcasts[0].image} alt="" className="absolute inset-0 w-full h-full object-cover" />
                 )}
                 <div className="absolute inset-0 bg-black/40" />
                 <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
                   <div className="flex-1 min-w-0 mr-3">
                     <p className="text-xs text-white/70 mb-0.5 font-medium">🔥 Mais tocado agora</p>
                     <h2 className="text-xl font-grotesk font-bold text-white truncate">{topPodcasts[0].title}</h2>
                     <p className="text-sm text-white/70 truncate">{topPodcasts[0].playCount || 0} reproduções</p>
                   </div>
                   <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center glow-primary flex-shrink-0">
                     <Play size={20} fill="white" className="text-white ml-0.5" />
                   </div>
                 </div>
               </motion.div>
             )}

             {/* Grid de Podcasts */}
             {topPodcasts.length > 1 && (
               <div>
                 <div className="grid grid-cols-2 gap-3 mb-3">
                   {displayedPodcasts.slice(1).map((podcast, i) => (
                     <motion.div key={podcast.feedUrl} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                       <div className="flex flex-col gap-2 p-2 rounded-2xl border border-border bg-card hover:border-primary/30 transition-all active:scale-95 h-full">
                         <div className="w-full aspect-square rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                           {podcast.image && (
                             <img src={podcast.image} alt="" className="w-full h-full object-cover" />
                           )}
                         </div>
                         <div className="min-w-0 px-1 flex-1">
                           <p className="text-xs font-medium line-clamp-2 text-foreground">{podcast.title}</p>
                           <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{podcast.author || 'Podcast'}</p>
                           <p className="text-xs text-primary mt-1">▶️ {podcast.playCount}</p>
                         </div>
                       </div>
                     </motion.div>
                   ))}
                 </div>

                 {/* Expand Podcasts */}
                 {topPodcasts.length > 9 && (
                   <motion.button
                     onClick={() => setExpandedPodcasts(!expandedPodcasts)}
                     className="w-full py-3 rounded-2xl bg-secondary hover:bg-secondary/80 text-foreground font-medium transition-colors text-sm"
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                   >
                     {expandedPodcasts ? '← Ver menos' : '+ Ver mais'}
                   </motion.button>
                 )}
               </div>
             )}
           </div>
         )}

        {!isLoading && sortedPlaylists.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-4xl mb-3">🎧</p>
            <p className="font-medium">Nenhuma playlist pública ainda.</p>
            <p className="text-sm mt-1">Crie a primeira!</p>
          </div>
        )}
      </div>
    </div>
  );
}