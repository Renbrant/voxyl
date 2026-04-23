import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const sections = [
  {
    title: '1. Dados que Coletamos',
    content: [
      '**Conta:** endereço de e-mail e nome completo fornecidos no cadastro.',
      '**Conteúdo gerado:** playlists criadas, feeds RSS adicionados, curtidas e seguidores.',
      '**Histórico de uso:** episódios reproduzidos, duração da escuta e preferências de autoplay.',
      '**Dados técnicos:** endereço IP, tipo de dispositivo, sistema operacional e identificadores de sessão.',
    ],
  },
  {
    title: '2. Como Usamos os Dados',
    content: [
      'Exibir e personalizar o feed de playlists públicas.',
      'Permitir a criação, edição e compartilhamento de playlists.',
      'Enviar notificações transacionais (confirmação de conta, convites).',
      'Moderar conteúdo denunciado e proteger a comunidade.',
      'Melhorar o desempenho e a experiência do aplicativo.',
    ],
  },
  {
    title: '3. Compartilhamento de Dados',
    content: [
      'Não vendemos nem alugamos seus dados pessoais a terceiros.',
      'Compartilhamos dados apenas com prestadores de serviço essenciais (hospedagem, autenticação) sob acordos de confidencialidade.',
      'Podemos divulgar dados quando exigido por lei ou para proteger direitos legais.',
    ],
  },
  {
    title: '4. Retenção de Dados',
    content: [
      'Seus dados são mantidos enquanto sua conta estiver ativa.',
      'Ao excluir a conta, removemos seus dados pessoais em até 30 dias, exceto quando houver obrigação legal de retenção.',
    ],
  },
  {
    title: '5. Seus Direitos',
    content: [
      'Acesso: solicitar uma cópia dos dados que possuímos sobre você.',
      'Correção: atualizar informações incorretas diretamente no perfil.',
      'Exclusão: solicitar a exclusão completa da sua conta e dados.',
      'Portabilidade: exportar seus dados em formato legível.',
    ],
  },
  {
    title: '6. Permissões do Dispositivo',
    content: [
      '**Câmera (android.permission.CAMERA):** Esta permissão é declarada no manifesto do aplicativo Android pela plataforma de build, porém o Voxyl **não acessa nem utiliza** a câmera do dispositivo em nenhuma funcionalidade. Nenhuma imagem ou vídeo é capturado pelo aplicativo.',
      '**Armazenamento:** Utilizado apenas para cache local de episódios e imagens de podcast, melhora a performance offline.',
      '**Internet:** Necessária para reprodução de episódios, carregamento de feeds RSS e sincronização de dados da conta.',
    ],
  },
  {
    title: '7. Segurança',
    content: [
      'Utilizamos criptografia em trânsito (HTTPS/TLS) e em repouso para proteger seus dados.',
      'Acesso interno aos dados é restrito e auditado.',
    ],
  },
  {
    title: '8. Crianças',
    content: [
      'O Voxyl não é destinado a menores de 13 anos. Não coletamos intencionalmente dados de crianças. Se identificarmos tal coleta, removeremos os dados imediatamente.',
    ],
  },
  {
    title: '9. Contato',
    content: [
      'Dúvidas ou solicitações relacionadas à privacidade: envie e-mail para privacy@voxyl.app',
    ],
  },
];

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 glass border-b border-border px-4 py-4 flex items-center gap-3"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}>
        <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
          <ArrowLeft size={16} />
        </button>
        <h1 className="font-grotesk font-bold text-base">Política de Privacidade</h1>
      </div>

      <div className="px-5 py-6 max-w-2xl mx-auto pb-16">
        <p className="text-xs text-muted-foreground mb-6">Última atualização: abril de 2026</p>

        <p className="text-sm text-muted-foreground mb-8">
          Esta Política de Privacidade descreve como o <strong className="text-foreground">Voxyl</strong> coleta, usa e protege suas informações pessoais quando você utiliza nosso aplicativo.
        </p>

        <div className="space-y-7">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="font-grotesk font-semibold text-sm text-foreground mb-2">{s.title}</h2>
              <ul className="space-y-1.5">
                {s.content.map((line, i) => (
                  <li key={i} className="text-sm text-muted-foreground leading-relaxed flex gap-2">
                    <span className="text-primary mt-1 flex-shrink-0">•</span>
                    <span dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>') }} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Data Deletion Section */}
        <div className="mt-10 rounded-2xl border border-destructive/30 bg-destructive/5 overflow-hidden">
          <div className="p-5">
            <h2 className="font-grotesk font-bold text-base text-foreground mb-1">🗑️ Como Excluir Sua Conta e Dados</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Você tem direito de excluir completamente sua conta e todos os seus dados pessoais do Voxyl. Há duas formas de fazer isso:
            </p>
          </div>

          {/* Option 1: Self-service in app */}
          <div className="px-5 pb-5">
            <div className="p-4 rounded-xl bg-card border border-border mb-4">
              <p className="font-grotesk font-semibold text-sm text-foreground mb-3">Opção 1 — Excluir pelo próprio app (imediato)</p>
              <ol className="space-y-3">
                {[
                  { icon: '📱', text: 'Acesse a aba Perfil no menu inferior do app.' },
                  { icon: '✋', text: 'Pressione e segure a palavra "Perfil" (título no topo da tela) por 5 segundos até a barra de progresso completar.' },
                  { icon: '🔓', text: 'A seção "Zona de Perigo" será desbloqueada no final da tela.' },
                  { icon: '🗑️', text: 'Toque em "Excluir Conta" e confirme digitando sua confirmação.' },
                  { icon: '✅', text: 'Sua conta, playlists, curtidas e histórico serão removidos imediatamente.' },
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <span className="text-base leading-none mt-0.5">{step.icon}</span>
                    <span className="text-sm text-muted-foreground leading-relaxed">
                      <strong className="text-foreground">Passo {i + 1}:</strong> {step.text}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="text-xs text-destructive/80 mt-4 font-medium">
                ⚠️ Esta ação é permanente e irreversível. Todos os seus dados serão apagados.
              </p>
            </div>

            {/* Option 2: Email */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <p className="font-grotesk font-semibold text-sm text-foreground mb-2">Opção 2 — Solicitar por e-mail</p>
              <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                Se preferir ou não conseguir acessar o app, envie um e-mail solicitando a exclusão:
              </p>
              <a
                href="mailto:privacy@voxyl.app?subject=Solicitação de Exclusão de Conta e Dados&body=Olá,%0A%0ASolicito a exclusão completa da minha conta e de todos os meus dados pessoais do Voxyl.%0A%0AE-mail da conta: [seu e-mail]%0A%0AAtenciosamente."
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive font-semibold text-sm"
              >
                ✉️ privacy@voxyl.app
              </a>
              <p className="text-xs text-muted-foreground mt-2">
                Inclua o e-mail da sua conta. Processamos em até <strong className="text-foreground">30 dias</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}