import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Plus, Trash2, Globe, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateShareToken } from '@/lib/rssUtils';
import { cn } from '@/lib/utils';

export default function CreatePlaylistModal({ user, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [maxDuration, setMaxDuration] = useState(0);
  const [feeds, setFeeds] = useState([{ url: '' }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addFeed = () => setFeeds(prev => [...prev, { url: '' }]);
  const removeFeed = (i) => setFeeds(prev => prev.filter((_, idx) => idx !== i));
  const updateFeed = (i, url) => setFeeds(prev => prev.map((f, idx) => idx === i ? { url } : f));

  const handleSave = async () => {
    if (!name.trim()) { setError('Nome é obrigatório'); return; }
    setSaving(true);
    setError('');
    const validFeeds = feeds.filter(f => f.url.trim());
    await base44.entities.Playlist.create({
      name: name.trim(),
      description: description.trim(),
      creator_id: user.id,
      creator_email: user.email,
      creator_name: user.full_name || user.email.split('@')[0],
      rss_feeds: validFeeds,
      is_public: isPublic,
      max_duration: maxDuration,
      share_token: generateShareToken(),
      likes_count: 0,
      plays_count: 0,
    });
    setSaving(false);
    onCreated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm px-0">
      <div className="w-full max-w-md bg-card border-t border-border rounded-t-3xl p-5 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-grotesk font-bold">Nova Playlist</h2>
          <button onClick={onClose} className="p-1.5 rounded-full bg-secondary text-muted-foreground">
            <X size={18} />
          </button>
        </div>

        {error && <p className="text-destructive text-sm mb-3 bg-destructive/10 px-3 py-2 rounded-xl">{error}</p>}

        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Nome *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Tech Weekly Picks"
              className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Descrição</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Sobre o que é essa playlist?"
              rows={2}
              className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Duração máxima (min, 0 = sem limite)</label>
            <input
              type="number"
              value={maxDuration}
              onChange={e => setMaxDuration(Number(e.target.value))}
              min={0}
              className="w-full px-4 py-3 rounded-2xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsPublic(true)}
              className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-medium transition-all border",
                isPublic ? "gradient-primary text-white border-transparent" : "bg-secondary text-muted-foreground border-border")}
            >
              <Globe size={14} /> Pública
            </button>
            <button
              onClick={() => setIsPublic(false)}
              className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-medium transition-all border",
                !isPublic ? "bg-primary text-white border-transparent" : "bg-secondary text-muted-foreground border-border")}
            >
              <Lock size={14} /> Privada
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-muted-foreground">Feeds RSS</label>
              <button onClick={addFeed} className="text-xs text-primary flex items-center gap-1">
                <Plus size={12} /> Adicionar
              </button>
            </div>
            <div className="space-y-2">
              {feeds.map((feed, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={feed.url}
                    onChange={e => updateFeed(i, e.target.value)}
                    placeholder="https://feed.exemplo.com/rss"
                    className="flex-1 px-3 py-2.5 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:border-primary"
                  />
                  {feeds.length > 1 && (
                    <button onClick={() => removeFeed(i)} className="p-2.5 rounded-xl bg-destructive/10 text-destructive">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-5 rounded-2xl gradient-primary border-0 py-6 text-base font-semibold"
        >
          {saving ? <Loader2 size={18} className="animate-spin mr-2" /> : null}
          {saving ? 'Salvando...' : 'Criar Playlist'}
        </Button>
      </div>
    </div>
  );
}