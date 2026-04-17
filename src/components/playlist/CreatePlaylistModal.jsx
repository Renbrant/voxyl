import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Plus, Trash2, Globe, Lock, Loader2, Image as ImageIcon, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateShareToken } from '@/lib/rssUtils';
import { cn } from '@/lib/utils';

const MAX_PLAYLISTS = 2;
const MAX_FEEDS = 5;

export default function CreatePlaylistModal({ user, onClose, onCreated, playlistCount = 0 }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [maxDuration, setMaxDuration] = useState(0);
  const [feeds, setFeeds] = useState([{ url: '' }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [generatingImage, setGeneratingImage] = useState(false);

  const atPlaylistLimit = playlistCount >= MAX_PLAYLISTS;

  const addFeed = () => {
    const validCount = feeds.filter(f => f.url.trim()).length;
    if (validCount >= MAX_FEEDS) { setError(`Máximo de ${MAX_FEEDS} podcasts por playlist durante o período de testes.`); return; }
    setFeeds(prev => [...prev, { url: '' }]);
  };
  const removeFeed = (i) => setFeeds(prev => prev.filter((_, idx) => idx !== i));
  const updateFeed = (i, url) => setFeeds(prev => prev.map((f, idx) => idx === i ? { url } : f));

  const handleGenerateImage = async () => {
    if (!name.trim()) { setError('Digite um nome para a playlist primeiro'); return; }
    setGeneratingImage(true);
    setError('');
    const prompt = `Create a vibrant and modern podcast playlist cover art for "${name.trim()}". ${description ? `Theme: ${description.trim()}. ` : ''}Style: colorful, eye-catching, professional. No text or logos.`;
    const res = await base44.integrations.Core.GenerateImage({ prompt }).catch(() => null);
    setGeneratingImage(false);
    if (res?.url) {
      setCoverImage(res.url);
    } else {
      setError('Erro ao gerar imagem');
    }
  };

  const handleUploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGeneratingImage(true);
    setError('');
    const res = await base44.integrations.Core.UploadFile({ file }).catch(() => null);
    setGeneratingImage(false);
    if (res?.file_url) {
      setCoverImage(res.file_url);
    } else {
      setError('Erro ao fazer upload da imagem');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Nome é obrigatório'); return; }
    const validFeeds = feeds.filter(f => f.url.trim());
    if (validFeeds.length > MAX_FEEDS) { setError(`Máximo de ${MAX_FEEDS} podcasts por playlist durante o período de testes.`); return; }
    setSaving(true);
    setError('');
    await base44.entities.Playlist.create({
      name: name.trim(),
      description: description.trim(),
      creator_id: user.id,
      creator_email: user.email,
      creator_name: user.full_name || user.email.split('@')[0],
      rss_feeds: validFeeds,
      is_public: isPublic,
      max_duration: maxDuration,
      cover_image: coverImage,
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

        {atPlaylistLimit ? (
          <div className="text-center py-6 px-2">
            <p className="text-4xl mb-3">🚧</p>
            <p className="font-semibold text-foreground mb-1">Limite de playlists atingido</p>
            <p className="text-sm text-muted-foreground">
              O Voxyl está em fase de testes e permite até <strong>{MAX_PLAYLISTS} playlists</strong> por usuário no momento. Mais funcionalidades serão liberadas em breve!
            </p>
          </div>
        ) : (
        <>
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

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Capa da Playlist</label>
            {coverImage ? (
              <div className="relative rounded-2xl overflow-hidden mb-3">
                <img src={coverImage} alt="Cover" className="w-full h-40 object-cover" />
                <button
                  onClick={() => setCoverImage('')}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="w-full h-40 rounded-2xl bg-secondary border border-border flex items-center justify-center mb-3">
                <p className="text-xs text-muted-foreground">Nenhuma capa selecionada</p>
              </div>
            )}
            <div className="flex gap-2">
              <label className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-secondary text-muted-foreground rounded-2xl border border-border cursor-pointer hover:border-primary/30 transition-all text-xs font-medium">
                <ImageIcon size={14} />
                Enviar
                <input type="file" accept="image/*" onChange={handleUploadImage} disabled={generatingImage} className="hidden" />
              </label>
              <button
                onClick={handleGenerateImage}
                disabled={generatingImage}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 gradient-primary text-white rounded-2xl text-xs font-medium disabled:opacity-50"
              >
                {generatingImage ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {generatingImage ? 'Gerando...' : 'Gerar IA'}
              </button>
            </div>
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
        </>
        )}
      </div>
    </div>
  );
}