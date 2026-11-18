// Telas da frase-senha: criar, mostrar o código de recuperação, destrancar num aparelho novo,
// recuperar, trocar e trancar os sonhos que ainda estão abertos no banco.
import { useState } from 'react';
import { useEstado } from '../lib/estado.jsx';
import { semViuvas as n } from '../lib/tipografia.js';
import Logo from './Logo.jsx';
import Assinatura from './Assinatura.jsx';
import Janela from './Janela.jsx';
import { Cadeado, Copiar, Importar } from './Icones.jsx';

const MINIMO = 10;

function Pagina({ children }) {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', padding: 20 }}>
      <div><Logo /></div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 460, display: 'flex', flexDirection: 'column', gap: 16, padding: '24px 0' }}>{children}</div>
      </div>
      <Assinatura />
    </div>
  );
}

function Bloco({ children }) {
  return <div style={{ width: '100%', maxWidth: 460, margin: '0 auto', padding: '48px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>;
}

const Selo = () => (
  <span style={{ width: 52, height: 52, borderRadius: 999, background: 'var(--azul-claro)', color: 'var(--azul-escuro)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Cadeado size={24} /></span>
);

function CampoSenha({ id, rotulo, valor, mudar, auto = 'new-password', foco = false }) {
  const [ver, setVer] = useState(false);
  return (
    <label htmlFor={id} style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600 }}>
      {rotulo}
      <span style={{ position: 'relative', display: 'flex' }}>
        <input id={id} className="campo" type={ver ? 'text' : 'password'} value={valor} onChange={(e) => mudar(e.target.value)}
          autoComplete={auto} autoFocus={foco} spellCheck={false} style={{ fontSize: 16, paddingRight: 64 }} />
        <button type="button" onClick={() => setVer(!ver)} style={{ position: 'absolute', right: 6, top: 0, bottom: 0, border: 0, background: 'transparent', color: 'var(--muted)', fontSize: 13, fontWeight: 700 }}>{ver ? 'esconder' : 'mostrar'}</button>
      </span>
    </label>
  );
}

// Valida duas digitações da frase-senha nova. Devolve a mensagem de erro, ou ''.
const conferir = (a, b) => (a.trim().length < MINIMO ? `Use pelo menos ${MINIMO} caracteres. Uma frase com 4 palavras é fácil de lembrar e difícil de adivinhar.` : a !== b ? 'As duas frases não estão iguais.' : '');

const TEXTO_BASICO = 'Se esquecer a frase-senha, é só entrar com o Google e criar outra.';
const TEXTO_AVANCADO = 'Você recebe um código de recuperação e é a única pessoa que o guarda. Se perder a frase-senha e o código, ninguém consegue recuperar os sonhos.';

// Básica vem marcada; a avançada aparece só como opção, para quem quiser.
function EscolhaNivel({ avancado, mudar }) {
  const [aberta, setAberta] = useState(avancado);
  if (!aberta) {
    return (
      <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)', lineHeight: 1.5 }}>
        {n(TEXTO_BASICO)}{' '}
        <button type="button" onClick={() => setAberta(true)} style={{ border: 0, background: 'transparent', color: 'var(--ink)', fontSize: 14, fontWeight: 700, textDecoration: 'underline', padding: 0 }}>{n('Há também um nível avançado de criptografia')}</button>
      </p>
    );
  }
  const opcao = (valor, titulo, texto) => (
    <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 12, border: '1.5px solid ' + (avancado === valor ? 'var(--ink)' : 'var(--line)'), cursor: 'pointer' }}>
      <input type="radio" name="nivel" checked={avancado === valor} onChange={() => mudar(valor)} style={{ width: 18, height: 18, marginTop: 2 }} />
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <strong style={{ fontSize: 15 }}>{titulo}</strong>
        <span style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.5 }}>{n(texto)}</span>
      </span>
    </label>
  );
  return (
    <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <legend className="rotulo" style={{ marginBottom: 6 }}>Nível de criptografia</legend>
      {opcao(false, 'Básico', TEXTO_BASICO)}
      {opcao(true, 'Avançado', TEXTO_AVANCADO)}
    </fieldset>
  );
}

/* ---------- primeira vez ---------- */
export function CriarFrase() {
  const { criarCofre, sair, usuario } = useEstado();
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [avancado, setAvancado] = useState(false);
  async function criar(e) {
    e.preventDefault();
    const problema = conferir(a, b);
    if (problema) { setErro(problema); return; }
    setOcupado(true); setErro('');
    try { await criarCofre(a, avancado ? 'avancado' : 'basico'); } catch (er) { setErro(er.message); setOcupado(false); }
  }
  return (
    <Pagina>
      <Selo />
      <span className="rotulo">Seus sonhos, trancados</span>
      <h1 className="titulo-m">{n('Crie uma frase-senha para trancar seus sonhos.')}</h1>
      <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}>{n('Cada sonho sai do seu aparelho já trancado com ela, e só abre para você e para quem você escolher. Você digita a frase-senha uma vez em cada aparelho.')}</p>
      <form onSubmit={criar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <CampoSenha id="frase-1" rotulo="Frase-senha" valor={a} mudar={setA} foco />
        <CampoSenha id="frase-2" rotulo="Repita a frase-senha" valor={b} mudar={setB} />
        <EscolhaNivel avancado={avancado} mudar={setAvancado} />
        {erro && <div className="aviso">{n(erro)}</div>}
        <button type="submit" className="btn btn-preto btn-grande" disabled={ocupado}>{ocupado ? 'Criando as chaves…' : 'Criar frase-senha'}</button>
      </form>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{n('Dá para mudar o nível depois, no menu ⋯ › Criptografia.')}</p>
      <button type="button" onClick={sair} style={{ alignSelf: 'flex-start', border: 0, background: 'transparent', color: 'var(--muted)', fontSize: 13, textDecoration: 'underline', padding: 0 }}>Sair de {usuario?.email}</button>
    </Pagina>
  );
}

/* ---------- código de recuperação ---------- */
export function MostrarCodigo() {
  const { codigoRecuperacao: codigo, esquecerCodigo, usuario, avisar } = useEstado();
  const [guardou, setGuardou] = useState(false);
  async function copiar() {
    try { await navigator.clipboard.writeText(codigo); avisar('Código copiado'); } catch { prompt('Copie o código:', codigo); }
  }
  function baixar() {
    const texto = `Sonhário · código de recuperação\nConta: ${usuario?.email || ''}\n\n${codigo}\n\nUse este código se esquecer a frase-senha. Guarde num lugar seguro, fora do celular se puder.\n`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([texto], { type: 'text/plain' }));
    a.download = 'sonhario-codigo-de-recuperacao.txt';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  return (
    <Pagina>
      <Selo />
      <span className="rotulo">Código de recuperação</span>
      <h1 className="titulo-m">{n('Guarde este código. É a única saída se você esquecer a frase-senha.')}</h1>
      <p translate="no" style={{ margin: 0, padding: '18px 16px', borderRadius: 12, background: 'var(--cinza)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 'clamp(17px, 4.6vw, 21px)', fontWeight: 700, letterSpacing: '0.04em', textAlign: 'center', wordBreak: 'break-word' }}>{codigo}</p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-linha" onClick={copiar}><Copiar size={16} /> Copiar</button>
        <button type="button" className="btn btn-linha" onClick={baixar}><Importar size={16} /> Baixar arquivo</button>
      </div>
      <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}>{n('Anote num papel, num gerenciador de senhas ou num lugar que não seja este aparelho. O Sonhário não guarda uma cópia aberta dele e não tem como mandar de novo.')}</p>
      <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 15, lineHeight: 1.5 }}>
        <input type="checkbox" checked={guardou} onChange={(e) => setGuardou(e.target.checked)} style={{ width: 20, height: 20, marginTop: 2 }} />
        {n('Guardei o código num lugar seguro.')}
      </label>
      <button type="button" className="btn btn-preto btn-grande" disabled={!guardou} onClick={esquecerCodigo}>Continuar</button>
    </Pagina>
  );
}

/* ---------- aparelho novo ---------- */
export function Destrancar() {
  const { destrancar, recuperarCofre, recuperarBasico, nivel, sair, usuario } = useEstado();
  const [modo, setModo] = useState('senha'); // 'senha' | 'codigo'
  const [senha, setSenha] = useState('');
  const [codigo, setCodigo] = useState('');
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    if (modo === 'codigo') { const p = conferir(a, b); if (p) { setErro(p); return; } }
    setOcupado(true);
    try {
      if (modo === 'senha') await destrancar(senha);
      else if (nivel === 'basico') await recuperarBasico(a);
      else await recuperarCofre(codigo, a);
    }
    catch (er) { setErro(er.message); setOcupado(false); }
  }

  return (
    <Bloco>
      <Selo />
      <h1 className="titulo-m">{n(modo === 'senha' ? 'Digite a frase-senha para abrir seus sonhos neste aparelho' : nivel === 'basico' ? 'Crie uma nova frase-senha' : 'Recuperar com o código')}</h1>
      <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {modo === 'senha' ? (
          <CampoSenha id="frase" rotulo="Frase-senha" valor={senha} mudar={setSenha} auto="current-password" foco />
        ) : (
          <>
            {nivel !== 'basico' && <label htmlFor="codigo" style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600 }}>
              Código de recuperação
              <input id="codigo" className="campo" value={codigo} onChange={(e) => setCodigo(e.target.value)} autoFocus autoComplete="off" spellCheck={false} placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX" style={{ fontSize: 16, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', textTransform: 'uppercase' }} />
            </label>}
            <CampoSenha id="nova-1" rotulo="Nova frase-senha" valor={a} mudar={setA} />
            <CampoSenha id="nova-2" rotulo="Repita a nova frase-senha" valor={b} mudar={setB} />
          </>
        )}
        {erro && <div className="aviso">{n(erro)}</div>}
        <button type="submit" className="btn btn-preto btn-grande" disabled={ocupado}>{ocupado ? 'Abrindo…' : modo === 'senha' ? 'Abrir' : nivel === 'basico' ? 'Criar e abrir' : 'Recuperar e abrir'}</button>
      </form>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{n(modo === 'senha'
        ? 'Você só precisa digitar uma vez por aparelho. Registrar um sonho novo funciona mesmo sem abrir.'
        : nivel === 'basico' ? 'Você já entrou com o Google, então basta criar uma nova. Ela passa a valer em todos os aparelhos.' : 'O código é o que apareceu quando você escolheu o nível avançado. A nova frase-senha passa a valer em todos os aparelhos.')}</p>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        <button type="button" onClick={() => { setModo(modo === 'senha' ? 'codigo' : 'senha'); setErro(''); }} style={{ border: 0, background: 'transparent', color: 'var(--ink)', fontSize: 14, fontWeight: 700, textDecoration: 'underline', padding: 0 }}>{modo === 'senha' ? 'Esqueci a frase-senha' : 'Voltar para a frase-senha'}</button>
        <button type="button" onClick={sair} style={{ border: 0, background: 'transparent', color: 'var(--muted)', fontSize: 13, textDecoration: 'underline', padding: 0 }}>Sair de {usuario?.email}</button>
      </div>
    </Bloco>
  );
}

export function ErroCofre() {
  const { abrirCofre } = useEstado();
  return (
    <Pagina>
      <Selo />
      <h1 className="titulo-m">{n('Não deu para abrir o cofre agora')}</h1>
      <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}>{n('Confira a internet e tente de novo. Enquanto isso, nada é salvo, para nenhum sonho sair aberto do aparelho.')}</p>
      <button type="button" className="btn btn-preto btn-grande" onClick={abrirCofre}>Tentar de novo</button>
    </Pagina>
  );
}

/* ---------- trocar a frase-senha (menu) ---------- */
export function TrocarFrase({ aoFechar }) {
  const { trocarSenha, avisar, nivel } = useEstado();
  const [atual, setAtual] = useState('');
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  async function enviar(e) {
    e.preventDefault();
    const p = conferir(a, b);
    if (p) { setErro(p); return; }
    setOcupado(true); setErro('');
    try { await trocarSenha(atual, a); avisar('Frase-senha trocada'); aoFechar(); } catch (er) { setErro(er.message); setOcupado(false); }
  }
  return (
    <Janela titulo="Trocar a frase-senha" aoFechar={aoFechar}>
      <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
        <CampoSenha id="t-atual" rotulo="Frase-senha atual" valor={atual} mudar={setAtual} auto="current-password" foco />
        <CampoSenha id="t-nova-1" rotulo="Nova frase-senha" valor={a} mudar={setA} />
        <CampoSenha id="t-nova-2" rotulo="Repita a nova frase-senha" valor={b} mudar={setB} />
        {erro && <div className="aviso">{n(erro)}</div>}
        <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{n((nivel === 'avancado' ? 'O código de recuperação continua o mesmo. ' : '') + 'Os outros aparelhos que já estão abertos seguem abertos.')}</p>
        <button type="submit" className="btn btn-preto" disabled={ocupado}>{ocupado ? 'Trocando…' : 'Trocar'}</button>
      </form>
    </Janela>
  );
}

/* ---------- configurações: nível e frase-senha ---------- */
export function JanelaCriptografia({ aoFechar, aoTrocarFrase }) {
  const { nivel, irParaAvancado, irParaBasico, avisar } = useEstado();
  const [passo, setPasso] = useState(''); // '' | 'avancado' | 'basico'
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  async function mudar(e) {
    e?.preventDefault();
    setOcupado(true); setErro('');
    try {
      if (passo === 'avancado') { await irParaAvancado(); aoFechar(); }
      else { await irParaBasico(senha); avisar('Nível básico ativado'); aoFechar(); }
    } catch (er) { setErro(er.message); setOcupado(false); }
  }
  return (
    <Janela titulo="Criptografia" aoFechar={aoFechar}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
        <p style={{ margin: 0, lineHeight: 1.6 }}>{n(`Seus sonhos ficam trancados com a sua frase-senha. Nível atual: ${nivel === 'avancado' ? 'avançado' : 'básico'}.`)}</p>
        <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--muted)' }}>{n(nivel === 'avancado' ? TEXTO_AVANCADO : TEXTO_BASICO)}</p>
        {!passo && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-linha" onClick={() => setPasso(nivel === 'avancado' ? 'basico' : 'avancado')}><Cadeado size={16} /> {nivel === 'avancado' ? 'Voltar para o básico' : 'Usar o nível avançado'}</button>
            <button type="button" className="btn btn-linha" onClick={aoTrocarFrase}>Trocar a frase-senha</button>
          </div>
        )}
        {passo === 'avancado' && (
          <>
            <div className="aviso">{n('No avançado, você recebe agora um código de recuperação e passa a ser a única pessoa que o guarda. Se perder a frase-senha e o código, ninguém consegue recuperar os sonhos.')}</div>
            {erro && <div className="aviso">{n(erro)}</div>}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-preto" disabled={ocupado} onClick={mudar}>{ocupado ? 'Mudando…' : 'Usar o avançado e ver o código'}</button>
              <button type="button" className="btn btn-linha" disabled={ocupado} onClick={() => setPasso('')}>Cancelar</button>
            </div>
          </>
        )}
        {passo === 'basico' && (
          <form onSubmit={mudar} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ margin: 0, lineHeight: 1.6 }}>{n('No básico, se esquecer a frase-senha, é só entrar com o Google e criar outra. Confirme a frase-senha atual:')}</p>
            <CampoSenha id="nivel-senha" rotulo="Frase-senha" valor={senha} mudar={setSenha} auto="current-password" foco />
            {erro && <div className="aviso">{n(erro)}</div>}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="submit" className="btn btn-preto" disabled={ocupado}>{ocupado ? 'Mudando…' : 'Voltar para o básico'}</button>
              <button type="button" className="btn btn-linha" disabled={ocupado} onClick={() => setPasso('')}>Cancelar</button>
            </div>
          </form>
        )}
      </div>
    </Janela>
  );
}

/* ---------- trancar o que é de antes ---------- */
function baixarCopia(sonhos) {
  const limpos = sonhos.map((s) => Object.fromEntries(Object.entries(s).filter(([k]) => !k.startsWith('_'))));
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify({ app: 'Sonhário', em: new Date().toISOString(), sonhos: limpos }, null, 2)], { type: 'application/json' }));
  a.download = `sonhario-copia-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function TrancarAcervo({ aoFechar }) {
  const { sonhos, lixeira, abertosNoBanco, trancarAcervo, avisar } = useEstado();
  const [copia, setCopia] = useState(false);
  const [progresso, setProgresso] = useState(null); // { feitos, total }
  const [resultado, setResultado] = useState(null);
  const ocupado = progresso && !resultado;

  async function trancar() {
    setProgresso({ feitos: 0, total: abertosNoBanco });
    try {
      const r = await trancarAcervo((feitos, total) => setProgresso({ feitos, total }));
      setResultado(r);
      if (!r.falhas.length) avisar(r.total === 1 ? '1 sonho trancado' : r.total + ' sonhos trancados');
    } catch (e) { setResultado({ total: 0, falhas: [{ erro: e.message }] }); }
  }

  return (
    <Janela titulo="Trancar os sonhos de antes" aoFechar={ocupado ? () => {} : aoFechar}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
        {!resultado && (
          <>
            <p style={{ margin: 0, lineHeight: 1.6 }}>{n(`${abertosNoBanco === 1 ? '1 sonho foi guardado' : abertosNoBanco + ' sonhos foram guardados'} antes da frase-senha e ainda ${abertosNoBanco === 1 ? 'está aberto' : 'estão abertos'} no banco. Trancar leva junto os áudios e as imagens.`)}</p>
            <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10, lineHeight: 1.5 }}>
              <li>
                {n('Baixe uma cópia de segurança, só para o caso de algo dar errado no meio do caminho. Ela fica no seu aparelho, aberta: guarde num lugar seu.')}
                <div style={{ marginTop: 8 }}><button type="button" className="btn btn-linha" disabled={ocupado} onClick={() => { baixarCopia([...sonhos, ...lixeira]); setCopia(true); }}><Importar size={16} /> {copia ? 'Cópia baixada' : 'Baixar cópia (.json)'}</button></div>
              </li>
              <li>{n('Tranque. Pode demorar alguns minutos se houver muitos áudios; deixe esta tela aberta.')}</li>
            </ol>
            {progresso && (
              <div aria-live="polite" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ height: 8, borderRadius: 999, background: 'var(--cinza)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: (progresso.total ? (100 * progresso.feitos) / progresso.total : 0) + '%', background: 'var(--ink)', transition: 'width .3s' }} />
                </div>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>{progresso.feitos} de {progresso.total}</span>
              </div>
            )}
            <button type="button" className="btn btn-preto" disabled={!copia || ocupado} onClick={trancar}><Cadeado size={16} /> {ocupado ? 'Trancando…' : `Trancar ${abertosNoBanco === 1 ? '1 sonho' : abertosNoBanco + ' sonhos'}`}</button>
          </>
        )}
        {resultado && (
          <>
            <p style={{ margin: 0, lineHeight: 1.6 }}>{n(resultado.falhas.length
              ? `${resultado.total - resultado.falhas.length} de ${resultado.total} trancados. ${resultado.falhas.length === 1 ? '1 não foi' : resultado.falhas.length + ' não foram'}: continuam legíveis e dá para tentar de novo.`
              : 'Pronto. Todos os sonhos estão trancados.')}</p>
            {resultado.falhas[0]?.erro && <div className="aviso">{n(resultado.falhas[0].erro)}</div>}
            <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{n('Cópias de segurança antigas do banco podem guardar a versão aberta por alguns dias, até expirarem.')}</p>
            <button type="button" className="btn btn-preto" onClick={aoFechar}>Fechar</button>
          </>
        )}
      </div>
    </Janela>
  );
}
