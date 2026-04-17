import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import VoxylHeader from '@/components/common/VoxylHeader';
import PlaylistCard from '@/components/playlist/PlaylistCard';
import PodcastSearchBar from '@/components/explore/PodcastSearchBar';
import PodcastResultCard from '@/components/explore/PodcastResultCard';
import AddToPlaylistModal from '@/components/explore/AddToPlaylistModal';
import { Compass, Radio } from 'lucide-react';
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

  const debouncedQuery = useDebounce(search, 600);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Fetch Voxyl playlists
  const { data: playlists = [], isLoading: playlistsLoading } = useQuery({
    queryKey: ['explore-playlists'],
    queryFn: () => base44.entities.Playlist.filter({ is_public: true }, '-created_date', 50),
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

  const filteredPlaylists = playlists.filter(p =>
    !voxylSearch ||
    p.name?.toLowerCase().includes(voxylSearch.toLowerCase()) ||
    p.description?.toLowerCase().includes(voxylSearch.toLowerCase()) ||
    p.creator_name?.toLowerCase().includes(voxylSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <VoxylHeader title="Explorar" subtitle="Descubra podcasts e playlists" />

      {/* Tabs */}
      <div className="flex gap-2 px-4 mb-4">
        {[
          { key: 'playlists', label: 'Playlists Voxyl', icon: Compass },
          { key: 'podcasts', label: 'Buscar Podcasts', icon: Radio },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all flex-1 justify-center",
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

      <div className="px-4 mb-4">
        {tab === 'playlists' ? (
          <PodcastSearchBar value={voxylSearch} onChange={setVoxylSearch} loading={false} />
        ) : (
          <PodcastSearchBar value={search} onChange={setSearch} loading={podcastLoading} />
        )}
      </div>

      <div className="px-4 pb-4">
        {tab === 'playlists' ? (
          playlistsLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-secondary animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPlaylists.map((pl, i) => (
                <motion.div key={pl.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <PlaylistCard playlist={pl} compact />
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
        ) : (
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
              <PodcastResultCard
                key={podcast.id}
                podcast={podcast}
                index={i}
                onAdd={setSelectedPodcast}
              />
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