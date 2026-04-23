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
        <div className="mt-10 p-5 rounded-2xl border border-destructive/30 bg-destructive/5">
          <h2 className="font-grotesk font-bold text-sm text-foreground mb-2">🗑️ Exclusão de Dados e Conta</h2>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            Você pode solicitar a exclusão completa dos seus dados e da sua conta a qualquer momento enviando um e-mail para:
          </p>
          <a
            href="mailto:privacy@voxyl.app?subject=Solicita%C3%A7%C3%A3o%20de%20Exclus%C3%A3o%20de%20Conta%20e%20Dados&body=Ol%C3%A1%2C%0A%0ASolicito%20a%20exclus%C3%A3o%20completa%20da%20minha%20conta%20e%20de%20todos%20os%20meus%20dados%20pessoais%20do%20Voxyl.%0A%0AE-mail%20da%20conta%3A%20%5Bseu%20e-mail%5D%0A%0AAtenciosamente."
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/20 border border-destructive/40 text-destructive font-semibold text-sm hover:bg-destructive/30 transition-colors"
          >
            ✉️ privacy@voxyl.app
          </a>
          <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
            Processamos solicitações de exclusão em até <strong className="text-foreground">30 dias</strong>. Inclua o e-mail da sua conta no corpo da mensagem.
          </p>

          <div className="mt-5 pt-4 border-t border-border">
            <h3 className="font-grotesk font-semibold text-xs text-foreground mb-2">Prefere excluir você mesmo agora?</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              O Voxyl possui uma opção de auto-exclusão diretamente no app. Veja como acessar:
            </p>
            <ol className="mt-3 space-y-2">
              {[
                'Abra o app e vá até a aba Perfil (ícone no menu inferior)',
                'Role até o final da página de perfil',
                'Toque 10 vezes seguidas no ícone do Voxyl no rodapé da página',
                'O menu "Zona de Perigo" será revelado',
                'Toque em "Excluir Conta" e siga as instruções de confirmação',
              ].map((step, i) => (
                <li key={i} className="flex gap-3 text-xs text-muted-foreground">
                  <span className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-primary font-bold flex-shrink-0 text-[10px]">{i + 1}</span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
            <p className="text-xs text-muted-foreground mt-3 italic">
              ⚠️ A exclusão é permanente e irreversível. Todos os seus dados, playlists e histórico serão removidos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}