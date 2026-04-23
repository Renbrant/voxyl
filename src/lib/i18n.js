// Detect browser/device language or get from localStorage
const detectLang = () => {
  const saved = localStorage.getItem('voxyl_language');
  if (saved === 'en' || saved === 'pt') return saved;
  
  const browserLang = navigator.language || navigator.languages?.[0] || 'pt';
  return browserLang.startsWith('pt') ? 'pt' : 'en';
};

export const lang = detectLang();
export const isEn = lang === 'en';

// Allow changing language preference
export const setLanguage = (newLang) => {
  if (newLang === 'en' || newLang === 'pt') {
    localStorage.setItem('voxyl_language', newLang);
    window.location.reload();
  }
};

const translations = {
  // Common
  loading: { pt: 'Carregando...', en: 'Loading...' },
  noResults: { pt: 'Nenhum resultado encontrado', en: 'No results found' },
  search: { pt: 'Buscar', en: 'Search' },

  // Navigation
  navFeed: { pt: 'Início', en: 'Home' },
  navExplore: { pt: 'Explorar', en: 'Explore' },
  navPlaylists: { pt: 'Curtidas', en: 'Saved' },
  navProfile: { pt: 'Perfil', en: 'Profile' },

  // Feed
  feedSubtitle: { pt: 'Descubra', en: 'Discover' },
  feedTrending: { pt: 'Em Alta', en: 'Trending' },
  feedRecent: { pt: 'Recentes', en: 'Recent' },
  feedPlaylistsHot: { pt: 'Playlists em Alta', en: 'Trending Playlists' },
  feedPodcastsHot: { pt: 'Podcasts em Alta', en: 'Trending Podcasts' },
  feedMostPlayed: { pt: '🔥 Mais tocada agora', en: '🔥 Most played now' },
  feedMostPlayedPodcast: { pt: '🔥 Mais tocado agora', en: '🔥 Most played now' },
  feedPlays: { pt: 'plays', en: 'plays' },
  feedRepros: { pt: 'reproduções', en: 'plays' },
  feedNoPlaylists: { pt: 'Nenhuma playlist pública ainda.', en: 'No public playlists yet.' },
  feedCreateFirst: { pt: 'Crie a primeira!', en: 'Be the first to create one!' },
  feedSeeMore: { pt: '+ Ver mais', en: '+ See more' },
  feedSeeLess: { pt: '← Ver menos', en: '← See less' },

  // Explore
  exploreTitle: { pt: 'Explorar', en: 'Explore' },
  exploreSubtitle: { pt: 'Descubra podcasts e playlists', en: 'Discover podcasts and playlists' },
  explorePlaylists: { pt: 'Playlists', en: 'Playlists' },
  explorePodcasts: { pt: 'Podcasts', en: 'Podcasts' },
  exploreUsers: { pt: 'Usuários', en: 'Users' },
  exploreSearchPlaylists: { pt: 'Buscar playlists...', en: 'Search playlists...' },
  exploreSearchPodcasts: { pt: 'Ex: tecnologia, true crime, notícias...', en: 'E.g.: technology, true crime, news...' },
  exploreConnections: { pt: 'Conexões', en: 'Connections' },
  explorePending: { pt: 'Aguardando', en: 'Pending' },
  exploreFollowers: { pt: 'Seguidores', en: 'Followers' },
  exploreFollowing: { pt: 'Seguindo', en: 'Following' },
  exploreNoConnections: { pt: 'Nenhuma conexão ainda', en: 'No connections yet' },
  exploreNoPending: { pt: 'Nenhuma solicitação pendente', en: 'No pending requests' },
  exploreDiscover: { pt: 'Descubra novos podcasts', en: 'Discover new podcasts' },
  exploreSearchHint: { pt: 'Pesquise por nome, tema ou assunto', en: 'Search by name, topic or subject' },
  exploreSuggestions: { pt: 'Sugestões populares', en: 'Popular suggestions' },
  exploreNoFound: { pt: 'Nenhum podcast encontrado para', en: 'No podcasts found for' },
  exploreSortRelevance: { pt: '🔍 Relevância', en: '🔍 Relevance' },
  exploreSortPopular: { pt: '🔥 Populares', en: '🔥 Popular' },
  exploreSortEpisodes: { pt: '📦 Mais episódios', en: '📦 Most episodes' },
  exploreSortRecent: { pt: '🕐 Episódio recente', en: '🕐 Recent episode' },
  exploreSortFrequent: { pt: '📅 Mais frequentes', en: '📅 Most frequent' },
  exploreAllLanguages: { pt: '🌍 Todos os idiomas', en: '🌍 All languages' },
  exploreAllCategories: { pt: '🎙️ Todas as categorias', en: '🎙️ All categories' },
  exploreCatTech: { pt: '💻 Tecnologia', en: '💻 Technology' },
  exploreCatBusiness: { pt: '💼 Negócios', en: '💼 Business' },
  exploreCatEducation: { pt: '📚 Educação', en: '📚 Education' },
  exploreCatEntertainment: { pt: '🎭 Entretenimento', en: '🎭 Entertainment' },
  exploreCatSports: { pt: '⚽ Esportes', en: '⚽ Sports' },
  exploreCatHealth: { pt: '❤️ Saúde & Bem-estar', en: '❤️ Health & Wellness' },
  exploreCatNews: { pt: '📰 Notícias', en: '📰 News' },
  exploreCatScience: { pt: '🔬 Ciência', en: '🔬 Science' },
  exploreCatHistory: { pt: '🏛️ História', en: '🏛️ History' },
  exploreCatCrime: { pt: '🔍 True Crime', en: '🔍 True Crime' },
  exploreCatComedy: { pt: '😂 Comédia', en: '😂 Comedy' },
  exploreCatPolitics: { pt: '🗳️ Política', en: '🗳️ Politics' },

  // Playlists page
  playlistsTitle: { pt: 'Curtidas', en: 'Saved' },
  playlistsSubtitle: { pt: 'Suas playlists e podcasts salvos', en: 'Your saved playlists and podcasts' },
  playlistsTabPlaylists: { pt: 'Playlists', en: 'Playlists' },
  playlistsTabPodcasts: { pt: 'Podcasts', en: 'Podcasts' },
  playlistsTabDownloads: { pt: 'Baixados', en: 'Downloads' },
  playlistsMine: { pt: 'Minhas playlists', en: 'My playlists' },
  playlistsLiked: { pt: 'Playlists curtidas', en: 'Liked playlists' },
  playlistsEmpty: { pt: 'Nenhuma playlist ainda', en: 'No playlists yet' },
  playlistsEmptyHint: { pt: 'Crie ou curta playlists para vê-las aqui!', en: 'Create or like playlists to see them here!' },
  playlistsNoPodcasts: { pt: 'Nenhum podcast curtido', en: 'No liked podcasts' },
  playlistsNoPodcastsHint: { pt: 'Explore e curta podcasts para salvá-los aqui!', en: 'Explore and like podcasts to save them here!' },
  playlistsNoDownloads: { pt: 'Nenhum episódio baixado', en: 'No downloaded episodes' },
  playlistsNoDownloadsHint: { pt: 'Funcionalidade ainda não implementada.', en: 'Feature not yet implemented.' },
  loginToAccess: { pt: 'Entre para continuar', en: 'Sign in to continue' },
  loginToAccessHint: { pt: 'Faça login para criar playlists, curtir e salvar seus podcasts favoritos.', en: 'Sign in to create playlists, like and save your favorite podcasts.' },
  loginWithGoogle: { pt: 'Entrar com Google', en: 'Sign in with Google' },

  // Profile
  profileTitle: { pt: 'Perfil', en: 'Profile' },
  profileSubtitle: { pt: 'Sua conta', en: 'Your account' },
  profileHidden: { pt: 'Perfil oculto', en: 'Profile hidden' },
  profileVisible: { pt: 'Perfil visível', en: 'Profile visible' },
  profileSetUsername: { pt: 'Definir nome de usuário', en: 'Set username' },
  profilePublicPlaylists: { pt: 'Playlists Públicas', en: 'Public Playlists' },
  profileFollowerPlaylists: { pt: 'Playlists para Seguidores', en: 'Followers-only Playlists' },
  profileNoPublic: { pt: 'Nenhuma playlist pública', en: 'No public playlists' },
  profileNoFollower: { pt: 'Nenhuma playlist exclusiva para seguidores', en: 'No followers-only playlists' },
  profileInvite: { pt: 'Convide seus amigos!', en: 'Invite your friends!' },
  profileInviteHint: { pt: 'Compartilhe o Voxyl com quem você ama', en: 'Share Voxyl with people you love' },
  profileInviteBtn: { pt: 'Convidar', en: 'Invite' },
  profileFollowRequests: { pt: 'pedido para seguir', en: 'follow request' },
  profileFollowRequestsPlural: { pt: 'pedidos para seguir', en: 'follow requests' },
  profileStats_playlists: { pt: 'playlists', en: 'playlists' },
  profileStats_public: { pt: 'públicas', en: 'public' },
  profileStats_followers: { pt: 'seguidores', en: 'followers' },
  profileLoginTitle: { pt: 'Entre para ver seu perfil', en: 'Sign in to view your profile' },
  profileLoginHint: { pt: 'Faça login para acessar seu perfil, suas playlists e configurações.', en: 'Sign in to access your profile, playlists and settings.' },
  profilePhoto: { pt: 'Foto de perfil', en: 'Profile photo' },
  profileUseLoginPhoto: { pt: 'Usar foto do login', en: 'Use login photo' },
  profileUploadPhoto: { pt: 'Enviar foto do celular', en: 'Upload from device' },
  profileEasterEgg: { pt: 'Easter egg encontrado!', en: 'Easter egg found!' },
  profileEasterEggMsg: { pt: '+5 playlists e +5 podcasts por playlist desbloqueados!', en: '+5 playlists and +5 podcasts per playlist unlocked!' },

  // Settings
  settingsTitle: { pt: 'Configurações', en: 'Settings' },
  settingsLanguage: { pt: 'Idioma', en: 'Language' },
  settingsLanguageAuto: { pt: 'Automático', en: 'Auto' },
  settingsLanguagePortuguese: { pt: 'Português', en: 'Portuguese' },
  settingsLanguageEnglish: { pt: 'Inglês', en: 'English' },
  settingsChooseLanguage: { pt: 'Escolher Idioma', en: 'Choose Language' },
  settingsTheme: { pt: 'Tema', en: 'Theme' },
  settingsThemeAuto: { pt: 'Automático', en: 'Auto' },
  settingsThemeDark: { pt: 'Escuro', en: 'Dark' },
  settingsThemeLight: { pt: 'Claro', en: 'Light' },
  settingsChooseTheme: { pt: 'Escolher Tema', en: 'Choose Theme' },
  settingsPrivacy: { pt: 'Privacidade do Perfil', en: 'Profile Privacy' },
  settingsPrivacyHidden: { pt: 'Seu perfil está oculto', en: 'Your profile is hidden' },
  settingsPrivacyVisible: { pt: 'Seu perfil é visível', en: 'Your profile is visible' },
  settingsBlockedUsers: { pt: 'Usuários Bloqueados', en: 'Blocked Users' },
  settingsBlockedCount: { pt: 'usuário bloqueado', en: 'blocked user' },
  settingsBlockedCountPlural: { pt: 'usuários bloqueados', en: 'blocked users' },
  settingsPrivacyPolicy: { pt: 'Política de Privacidade', en: 'Privacy Policy' },
  settingsPrivacyPolicyDesc: { pt: 'Leia nossa política', en: 'Read our policy' },
  settingsLogout: { pt: 'Sair da Conta', en: 'Sign Out' },
  settingsLogoutDesc: { pt: 'Você será desconectado', en: 'You will be signed out' },
  settingsActions: { pt: 'Ações', en: 'Actions' },
  settingsDeleteAccount: { pt: 'Excluir Conta', en: 'Delete Account' },
  settingsDeleteAccountDesc: { pt: 'Ação permanente e irreversível', en: 'Permanent and irreversible action' },
  settingsHidden: { pt: 'Oculto', en: 'Hidden' },

  // PlaylistDetail
  detailEpisodes: { pt: 'Episódios', en: 'Episodes' },
  detailPlayAll: { pt: 'Tocar tudo', en: 'Play all' },
  detailLoadingFeeds: { pt: 'Carregando feeds...', en: 'Loading feeds...' },
  detailNoEpisodes: { pt: 'Nenhum episódio encontrado', en: 'No episodes found' },
  detailNoEpisodesHint: { pt: 'Verifique os feeds RSS da playlist', en: 'Check the playlist RSS feeds' },
  detailFilterLabel: { pt: 'Filtro: episódios até', en: 'Filter: episodes up to' },
  detailFilterMin: { pt: 'min', en: 'min' },
  detailHeard: { pt: 'ouvido', en: 'heard' },
  detailBy: { pt: 'por', en: 'by' },
  detailFeeds: { pt: 'feeds', en: 'feeds' },
  detailUser: { pt: 'Usuário', en: 'User' },
};

export function t(key) {
  const entry = translations[key];
  if (!entry) return key;
  return entry[lang] || entry['pt'] || key;
}