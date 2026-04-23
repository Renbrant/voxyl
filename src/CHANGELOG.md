# Changelog — Voxyl

## v0.1 — Abril 2026

### Lançamento inicial

#### Funcionalidades principais
- Feed principal com playlists em alta e recentes
- Seção "Podcasts em Alta" com ranking por reproduções
- Criação e edição de playlists com até 5 feeds RSS
- Player de áudio persistente com controles de reprodução
- Autoplay automático entre episódios
- Progresso de episódios salvo localmente e na nuvem
- Marcar episódios como concluídos (swipe ou pressão longa)

#### Social
- Seguir e ser seguido por outros usuários
- Aprovação de seguidores (modo privado)
- Curtir playlists
- Compartilhar playlists via link público (`/share/:id`)
- Bloquear e denunciar usuários ou conteúdo

#### Explorar
- Busca de podcasts via Podcast Index API
- Busca de usuários da plataforma
- Adicionar podcast diretamente a uma playlist existente ou nova

#### Perfil
- Página de perfil público com playlists e contagem de seguidores
- Username público personalizável
- Foto de perfil e configurações de conta
- Exclusão de conta

#### Playlists
- Visibilidade: pública, apenas seguidores, privada
- Filtro por duração máxima de episódio
- Filtro por data de publicação (últimas 24h, semana, mês, etc.)
- Ordem dos episódios: mais recentes ou mais antigos
- Capa personalizada (upload de imagem)
- Pular início/fim de cada feed (corte de vinheta)
- Reordenação de feeds por drag-and-drop

#### Técnico
- PWA com suporte offline parcial
- Cache de feeds RSS em localStorage e nuvem
- Política de Privacidade com declaração de permissões Android
- Suporte a tema escuro / claro / automático