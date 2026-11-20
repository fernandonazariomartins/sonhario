import { Link } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import Assinatura from '../components/Assinatura.jsx';
import { semViuvas as n } from '../lib/tipografia.js';
import { tr } from '../lib/i18n.js';

const SECOES = [
  [tr("O que o Sonhário guarda"), [
    tr("Os sonhos que você registra: título, relato, áudio gravado, temas, status, cor, amplificações e datas."),
    tr("Se você entrar com Google: seu nome, seu e-mail e sua foto de perfil, só para identificar a sua conta. O Sonhário não pede acesso a mais nada da sua conta Google."),
  ]],
  [tr("Onde ficam os dados"), [
    tr("Sem conta, tudo fica apenas no seu aparelho, no próprio navegador."),
    tr("Com conta, os sonhos e os áudios ficam guardados no Supabase, um serviço de banco de dados, trancados com a sua frase-senha, como explicado abaixo. Além disso, regras de acesso garantem que cada pessoa veja somente os próprios sonhos e os que alguém compartilhou com ela."),
  ]],
  [tr("Criptografia"), [
    tr("Com conta, você cria uma frase-senha. Cada sonho sai do seu aparelho já trancado: título, relato, temas, amplificações, áudio, imagens e comentários. No banco de dados fica só texto embaralhado."),
    tr("Ficam abertos no banco só o necessário para o app funcionar: datas, status, cor, favorito, lixeira, a duração dos áudios, o tamanho das imagens e com quem cada sonho foi compartilhado."),
    tr("A frase-senha nunca sai do seu aparelho. Junto com ela é criado um código de recuperação, que também abre os seus sonhos."),
    tr("No nível básico, uma cópia desse código fica guardada no nosso servidor, trancada, e só é devolvida à sua conta Google quando você esquece a frase-senha."),
    tr("No nível avançado, essa cópia não existe: só você guarda o código, e ninguém além de você e de quem você escolher consegue abrir os sonhos, nem quem administra o Sonhário. Se perder a frase-senha e o código, os sonhos não podem ser recuperados. Você escolhe o nível ao criar a frase-senha e pode mudar em ⋯ › Criptografia."),
    tr("Sonhos guardados antes da frase-senha continuam abertos no banco até você tocar em \"trancar\". Cópias de segurança antigas do banco podem guardar essa versão aberta por alguns dias, até expirarem."),
  ]],
  [tr("O que não fazemos"), [
    tr("Não vendemos, não alugamos e não compartilhamos seus dados com ninguém. Só vê seus sonhos quem você mesmo convidar: a chave de cada sonho vai trancada só para essas pessoas."),
    tr("Não usamos seus sonhos para publicidade nem para treinar inteligência artificial."),
  ]],
  [tr("Inteligência artificial"), [
    tr("Os temas automáticos procuram temas no próprio aparelho, sem enviar nada. Se você ligar a inteligência artificial (menu ⋯, desligada até você ligar), o relato daquele sonho também vai aberto para a OpenAI, que sugere temas. A OpenAI não usa esses dados para treinar os modelos dela."),
  ]],
  [tr("Compartilhar com terapeuta ou amigos"), [
    tr("Você pode mostrar um sonho de cada vez para outras pessoas, pelo e-mail da conta Google delas. Nunca o caderno inteiro: cada pessoa vê só os sonhos que você escolheu para ela, e só vê as amplificações se você permitir."),
    tr("Você também pode gerar o link de um sonho. Quem abrir e entrar com a conta Google faz um pedido para ver, e só vê depois que você aprovar."),
    tr("Quem recebe o acesso só lê: não edita nem apaga. Você pode tirar o acesso a qualquer momento, e ele some na hora."),
  ]],
  [tr("Transcrição de voz"), [
    tr("Quando você grava, a fala pode virar texto pelo reconhecimento de voz do próprio navegador (por exemplo, o do Google Chrome), que segue as regras de privacidade de quem fez o navegador."),
    tr("Nos navegadores que não transcrevem enquanto você fala (como o Safari no iPhone), o áudio só vai para a OpenAI virar texto se você tiver ligado a inteligência artificial."),
  ]],
  [tr("Links para a Amazon"), [
    tr("A página inicial indica livros com links da Amazon. Se você comprar por eles, o Sonhário pode receber uma comissão, sem custo a mais para você. A Amazon tem a própria política de privacidade."),
  ]],
  [tr("Apagar seus dados"), [
    tr("Você pode apagar qualquer sonho dentro do app. Para apagar a conta inteira e tudo o que está nela, escreva para fernandonazariomartins@outlook.com e fazemos isso em até 30 dias."),
  ]],
  [tr("Termos de uso"), [
    tr("O Sonhário é um caderno de sonhos gratuito, oferecido como está. Ele apoia o seu processo, mas nunca substitui análise, terapia ou acompanhamento profissional."),
    tr("O que você escreve é seu. Use o app de forma pessoal e dentro da lei."),
  ]],
];

export default function Privacidade() {
  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <header style={{ padding: '18px 20px', borderBottom: '1px solid var(--line)' }}><Logo /></header>
      <main style={{ maxWidth: 680, margin: '0 auto', padding: '48px 20px 24px' }}>
        <h1 style={{ fontSize: 44, fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1.05, margin: '0 0 12px' }}>{n(tr("Privacidade e termos"))}</h1>
        <p style={{ color: 'var(--muted)', margin: '0 0 36px' }}>{n(tr("Atualizado em novembro de 2026."))}</p>
        {SECOES.map(([t, ps]) => (
          <section key={t} style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em', margin: '0 0 8px' }}>{n(t)}</h2>
            {ps.map((p) => <p key={p} style={{ margin: '0 0 10px', lineHeight: 1.6 }}>{n(p)}</p>)}
          </section>
        ))}
        <Link to="/" className="btn btn-preto" style={{ marginTop: 8 }}>{tr("Voltar para o início")}</Link>
      </main>
      <footer style={{ padding: '32px 20px', display: 'flex', justifyContent: 'center' }}><Assinatura /></footer>
    </div>
  );
}
