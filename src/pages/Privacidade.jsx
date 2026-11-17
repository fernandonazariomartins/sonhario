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
    'Com conta, os sonhos e os áudios ficam guardados no Supabase, um serviço de banco de dados. Regras de acesso garantem que cada pessoa veja somente os próprios sonhos e os que alguém compartilhou com ela.',
  ]],
  ['O que não fazemos', [
    'Não vendemos, não alugamos e não compartilhamos seus dados com ninguém. Só vê seus sonhos quem você mesmo convidar.',
    'Não usamos seus sonhos para publicidade nem para treinar inteligência artificial.',
    'Ninguém lê os seus sonhos. Eles são seus.',
  ]],
  ['Compartilhar com terapeuta ou amigos', [
    'Você pode liberar o acesso aos seus sonhos para outras pessoas, pelo e-mail da conta Google delas. Você escolhe se elas veem todos os sonhos ou só os que você marcar, e se veem as amplificações.',
    'Você também pode gerar um link. Ele vale para uma pessoa só: a primeira que abrir e entrar com a conta Google passa a ver, e o link deixa de funcionar para qualquer outra.',
    'Quem recebe o acesso só lê: não edita nem apaga. Você pode tirar o acesso a qualquer momento, e ele some na hora.',
  ]],
  ['Transcrição de voz', [
    'Quando você grava, a fala pode virar texto pelo reconhecimento de voz do próprio navegador (por exemplo, o do Google Chrome), que segue as regras de privacidade de quem fez o navegador.',
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
