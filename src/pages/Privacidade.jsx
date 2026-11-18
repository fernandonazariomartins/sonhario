import { Link } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import Assinatura from '../components/Assinatura.jsx';
import { semViuvas as n } from '../lib/tipografia.js';

const SECOES = [
  ['O que o Sonhário guarda', [
    'Os sonhos que você registra: título, relato, áudio gravado, temas, status, cor, amplificações e datas.',
    'Se você entrar com Google: seu nome, seu e-mail e sua foto de perfil, só para identificar a sua conta. O Sonhário não pede acesso a mais nada da sua conta Google.',
  ]],
  ['Onde ficam os dados', [
    'Sem conta, tudo fica apenas no seu aparelho, no próprio navegador.',
    'Com conta, os sonhos e os áudios ficam guardados no Supabase, um serviço de banco de dados, com conexão protegida. Regras de acesso garantem que cada pessoa que usa o app veja somente os próprios sonhos e os que alguém compartilhou com ela.',
  ]],
  ['Quem administra o app', [
    'Hoje os sonhos ficam guardados sem criptografia de ponta a ponta. Isso quer dizer que quem administra o banco de dados teria como acessá-los. Nós não lemos os seus sonhos e só abriríamos um registro se você pedisse ajuda com ele.',
    'Estamos trabalhando para que o sonho saia do seu aparelho já trancado com uma senha que só você sabe, de modo que nem nós consigamos ler. Quando isso estiver pronto, esta página avisa.',
    'Enquanto isso, se preferir, você pode usar o Sonhário sem conta: aí tudo fica apenas no seu aparelho.',
  ]],
  ['O que não fazemos', [
    'Não vendemos, não alugamos e não compartilhamos seus dados com ninguém. Só vê seus sonhos quem você mesmo convidar.',
    'Não usamos seus sonhos para publicidade nem para treinar inteligência artificial.',
  ]],
  ['Temas automáticos', [
    'Ao tocar em "Temas automáticos", o app primeiro procura temas no próprio aparelho. Se você estiver logado, o relato daquele sonho também é enviado para a OpenAI, que sugere temas. Isso só acontece quando você toca no botão, e a OpenAI não usa esses dados para treinar os modelos dela.',
  ]],
  ['Compartilhar com terapeuta ou amigos', [
    'Você pode mostrar um sonho de cada vez para outras pessoas, pelo e-mail da conta Google delas. Nunca o caderno inteiro: cada pessoa vê só os sonhos que você escolheu para ela, e só vê as amplificações se você permitir.',
    'Você também pode gerar o link de um sonho. Quem abrir e entrar com a conta Google faz um pedido para ver, e só vê depois que você aprovar.',
    'Quem recebe o acesso só lê: não edita nem apaga. Você pode tirar o acesso a qualquer momento, e ele some na hora.',
  ]],
  ['Transcrição de voz', [
    'Quando você grava, a fala pode virar texto pelo reconhecimento de voz do próprio navegador (por exemplo, o do Google Chrome), que segue as regras de privacidade de quem fez o navegador.',
    'Nos navegadores que não transcrevem enquanto você fala (como o Safari no iPhone), o áudio gravado pode ser enviado para a OpenAI, que devolve o texto.',
  ]],
  ['Links para a Amazon', [
    'A página inicial indica livros com links da Amazon. Se você comprar por eles, o Sonhário pode receber uma comissão, sem custo a mais para você. A Amazon tem a própria política de privacidade.',
  ]],
  ['Apagar seus dados', [
    'Você pode apagar qualquer sonho dentro do app. Para apagar a conta inteira e tudo o que está nela, escreva para fernandonazariomartins@outlook.com e fazemos isso em até 30 dias.',
  ]],
  ['Termos de uso', [
    'O Sonhário é um caderno de sonhos gratuito, oferecido como está. Ele apoia o seu processo, mas nunca substitui análise, terapia ou acompanhamento profissional.',
    'O que você escreve é seu. Use o app de forma pessoal e dentro da lei.',
  ]],
];

export default function Privacidade() {
  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <header style={{ padding: '18px 20px', borderBottom: '1px solid var(--line)' }}><Logo /></header>
      <main style={{ maxWidth: 680, margin: '0 auto', padding: '48px 20px 24px' }}>
        <h1 style={{ fontSize: 44, fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1.05, margin: '0 0 12px' }}>{n('Privacidade e termos')}</h1>
        <p style={{ color: 'var(--muted)', margin: '0 0 36px' }}>{n('Atualizado em novembro de 2026.')}</p>
        {SECOES.map(([t, ps]) => (
          <section key={t} style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em', margin: '0 0 8px' }}>{n(t)}</h2>
            {ps.map((p) => <p key={p} style={{ margin: '0 0 10px', lineHeight: 1.6 }}>{n(p)}</p>)}
          </section>
        ))}
        <Link to="/" className="btn btn-preto" style={{ marginTop: 8 }}>Voltar para o início</Link>
      </main>
      <footer style={{ padding: '32px 20px', display: 'flex', justifyContent: 'center' }}><Assinatura /></footer>
    </div>
  );
}
