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
          <div className="p-5 pb-0">
            <h2 className="font-grotesk font-bold text-base text-foreground mb-2">🗑️ Como Excluir Sua Conta e Dados</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Você pode excluir sua conta e apagar todos os seus dados diretamente pelo app, a qualquer momento. O processo é simples e imediato:
            </p>
          </div>

          <div className="px-5 pb-5">
            <ol className="space-y-4">
              {[
                { icon: '📱', title: 'Vá para a aba Perfil', text: 'No menu inferior do app, toque no ícone de Perfil.' },
                { icon: '✋', title: 'Pressione e segure "Perfil"', text: 'No topo da tela de Perfil, pressione e segure a palavra "Perfil" por 5 segundos. Uma barra de progresso aparecerá enquanto você segura.' },
                { icon: '🔓', title: 'A Zona de Perigo será revelada', text: 'Após os 5 segundos, uma seção chamada "Zona de Perigo" aparece no final da tela.' },
                { icon: '🗑️', title: 'Toque em "Excluir Conta"', text: 'Dentro da Zona de Perigo, toque em "Excluir Conta". O app pedirá uma confirmação antes de prosseguir.' },
                { icon: '✅', title: 'Confirmação e exclusão', text: 'Confirme a ação. Sua conta, playlists, curtidas, histórico de reprodução e todos os dados pessoais serão removidos permanentemente.' },
              ].map((step, i) => (
                <li key={i} className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center flex-shrink-0 text-sm">
                    {step.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{step.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-5 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
              <p className="text-xs text-destructive font-medium">
                ⚠️ A exclusão é permanente e irreversível. Não é possível recuperar os dados após a confirmação.
              </p>
            </div>

            <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
              Caso não consiga acessar o app, envie um e-mail para{' '}
              <a href="mailto:privacy@voxyl.app" className="text-primary underline">privacy@voxyl.app</a>{' '}
              e processaremos sua solicitação em até 30 dias.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}