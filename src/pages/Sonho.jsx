import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useEstado, useCorTema } from '../lib/estado.jsx';
import { STATUS, CORES, dataLonga, dataCurta, tituloDe, contarTemas, novoId, duracao, paraCampoData, deCampoData } from '../lib/sonhos.js';
import { transcricaoNoServidor, transcreverAudio } from '../lib/transcrever.js';
import { sugerirTemas, sugerirTemasIA, juntarIA } from '../lib/temasAuto.js';
import { iaLigada } from '../lib/ia.js';
import { Voltar, Fechar, Mais, Lixo, Ok, Calendario, Faisca, Compartilhar } from '../components/Icones.jsx';
import { semViuvas } from '../lib/tipografia.js';
import { quemVe, pessoa, terapeutaDe } from '../lib/compartilhar.js';
import { BotaoConvite } from '../components/Convidar.jsx';
import { CompartilharSonho } from '../components/Compartilhar.jsx';
import { BotaoFavorito, enderecoAcervo } from './Acervo.jsx';
import Avatar from '../components/Avatar.jsx';
import Janela from '../components/Janela.jsx';
import Imagens from '../components/Imagens.jsx';
import Comentarios from '../components/Comentarios.jsx';
import { prepararImagem } from '../lib/midia.js';
import { tr } from '../lib/i18n.js';

export default function Sonho() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navegar = useNavigate();
  const { sonhos, salvar, apagar, urlAudio, urlImagem, salvarImagem, apagarImagem, usuario, avisar, compartilhamentos, temLogin, recarregarComentarios, carregado } = useEstado();
  const [audioFalhou, setAudioFalhou] = useState(false);
  const [compartilhando, setCompartilhando] = useState(false);
  const estiloTema = useCorTema();
  const original = sonhos.find((s) => s.id === id);
  const [s, setS] = useState(original);
  const [novoTema, setNovoTema] = useState('');
  const [conclusao, setConclusao] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);
  const [editandoData, setEditandoData] = useState(false);
  const [transcrevendo, setTranscrevendo] = useState(false);
  const [sugestao, setSugestao] = useState(null); // { doAcervo, novos, ia, marcados, buscando } enquanto a janela dos temas automáticos está aberta
  const timer = useRef(null);
  const relato = useRef(null);

  // O relato cresce com o texto: o sonho inteiro fica visível, sem barra de rolagem dentro da caixa.
  useLayoutEffect(() => {
    const el = relato.current;
    if (!el) return;
    const ajustar = () => { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; };
    ajustar();
    window.addEventListener('resize', ajustar);
    return () => window.removeEventListener('resize', ajustar);
  }, [s?.texto, s?.id]);

  // Troca de sonho, ou chegou uma versão mais nova (ex.: transcrição terminada depois de guardar).
  useEffect(() => {
    if (!original) return;
    setS((atual) => (!atual || atual.id !== original.id || original.atualizado_em > atual.atualizado_em ? original : atual));
  }, [original]);
  useEffect(() => {
    let vivo = true;
    setAudioFalhou(false);
    if (s?.audio?.ref) urlAudio(s.audio.ref).then((u) => vivo && setAudioUrl(u));
    return () => { vivo = false; };
  }, [s?.audio?.ref]); // eslint-disable-line react-hooks/exhaustive-deps

  const parecidos = useMemo(() => !s ? [] : sonhos.filter((x) => x.id !== s.id && x.temas?.some((t) => s.temas?.includes(t))).slice(0, 6), [sonhos, s]);

  if (!s && !carregado) return (
    <div role="status" className="carregando-resto" style={{ padding: 40, justifyContent: 'center', width: '100%' }}><span className="girando" aria-hidden="true" />{tr("Abrindo o sonho…")}</div>
  );
  if (!s) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <p>{tr("Esse sonho não está aqui.")}</p>
      <Link to={enderecoAcervo()}>{tr("Voltar para o acervo")}</Link>
    </div>
  );

  // Salva sozinho, meio segundo depois da última mudança.
  function mudar(parcial, imediato = false) {
    const prox = { ...s, ...parcial };
    setS(prox);
    clearTimeout(timer.current);
    if (imediato) salvar(prox); else timer.current = setTimeout(() => salvar(prox), 500);
  }
  async function temasAutomaticos() {
    const texto = (s.titulo || '') + ' ' + (s.texto || '');
    if (!s.texto?.trim()) { avisar(tr("Escreva o relato primeiro.")); return; }
    const acervo = contarTemas(sonhos).map((t) => t.nome);
    const grupos = sugerirTemas(texto, s.temas, acervo);
    const comIA = !!usuario && iaLigada();
    if (!comIA && !grupos.doAcervo.length && !grupos.novos.length) { avisar(tr("Não encontrei temas no relato. Dá para pôr à mão.")); return; }
    // Os do seu acervo já vêm marcados; as sugestões novas, só se você marcar.
    setSugestao({ ...grupos, ia: [], marcados: grupos.doAcervo, buscando: comIA });
    if (!comIA) return;
    const daIA = await sugerirTemasIA(s.texto, [...s.temas, ...grupos.doAcervo, ...grupos.novos]);
    const { doAcervo, ia } = juntarIA(grupos, daIA, s.temas, acervo);
    const extrasAcervo = doAcervo.filter((t) => !grupos.doAcervo.includes(t));
    if (!doAcervo.length && !grupos.novos.length && !ia.length) { setSugestao(null); avisar(tr("Não encontrei temas no relato. Dá para pôr à mão.")); return; }
    setSugestao((x) => x && { ...x, doAcervo, ia, marcados: [...x.marcados, ...extrasAcervo], buscando: false });
  }
  function aceitarSugestao() {
    const escolhidos = sugestao.marcados.filter((t) => !s.temas.includes(t));
    if (escolhidos.length) {
      mudar({ temas: [...s.temas, ...escolhidos] }, true);
      avisar(escolhidos.length === 1 ? tr("1 tema adicionado.") : escolhidos.length + tr(" temas adicionados."));
    }
    setSugestao(null);
  }
  const alternarSugestao = (t) => setSugestao((x) => ({ ...x, marcados: x.marcados.includes(t) ? x.marcados.filter((m) => m !== t) : [...x.marcados, t] }));
  const chipSugestao = (t) => { const on = sugestao.marcados.includes(t); return (
    <button key={t} type="button" aria-pressed={on} onClick={() => alternarSugestao(t)}
      style={{ ...estiloTema(t), height: 34, padding: '0 12px 0 8px', borderRadius: 6, border: 0, fontSize: 14, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, opacity: on ? 1 : 0.55 }}>
      <span style={{ width: 18, height: 18, borderRadius: 4, border: '1.5px solid currentColor', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{on && <Ok size={12} />}</span>
      {t}
    </button>); };
  const addTema = (t) => { const nome = t.trim(); if (nome && !s.temas.includes(nome)) mudar({ temas: [...s.temas, nome] }, true); setNovoTema(''); };
  async function transcrever() {
    setTranscrevendo(true);
    try {
      const url = audioUrl || await urlAudio(s.audio.ref);
      const blob = await (await fetch(url)).blob();
      const txt = await transcreverAudio(blob);
      if (txt) mudar({ texto: [s.texto, txt].filter(Boolean).join('\n\n') }, true);
      else avisar(tr("Não encontrei fala no áudio."));
    } catch { avisar(tr("Não deu para transcrever agora.")); }
    setTranscrevendo(false);
  }
  const addConclusao = () => {
    if (!conclusao.trim()) return;
    mudar({ conclusoes: [{ id: novoId(), em: new Date().toISOString(), texto: conclusao.trim() }, ...(s.conclusoes || [])], status: s.status === 'nao_aberto' ? 'aberto' : s.status }, true);
    setConclusao('');
  };

  async function adicionarImagens(arquivos) {
    const novas = [];
    for (const f of arquivos) {
      try {
        const { blob, largura, altura } = await prepararImagem(f, f.name);
        const ref = await salvarImagem(s.id + '-' + novoId().slice(0, 8), blob);
        novas.push({ ref, largura, altura, nome: f.name });
      } catch (e) { avisar(tr("Não deu para guardar a imagem: ") + e.message); }
    }
    if (novas.length) mudar({ imagens: [...(s.imagens || []), ...novas] }, true);
  }
  function tirarImagem(im) {
    mudar({ imagens: (s.imagens || []).filter((x) => x.ref !== im.ref) }, true);
    apagarImagem(im.ref);
  }

  const veem = quemVe(compartilhamentos.meus, s).map((c) => pessoa(compartilhamentos.perfis, c.convidado_email, c.convidado_nome));
  // Com um terapeuta marcado em Pessoas com acesso, levar para a sessão já compartilha com essa pessoa.
  const terapeuta = terapeutaDe(compartilhamentos.meus);
  const nomeTerapeuta = terapeuta && pessoa(compartilhamentos.perfis, terapeuta.convidado_email, terapeuta.convidado_nome).nome;
  const terapeutaVe = terapeuta && (s.compartilhado_com || []).includes(terapeuta.convidado_email);
  function levarSessao(ligar) {
    if (!ligar || !terapeuta || terapeutaVe) return mudar({ levar_sessao: ligar }, true);
    mudar({ levar_sessao: true, compartilhado_com: [...(s.compartilhado_com || []), terapeuta.convidado_email] }, true);
    avisar(tr("Compartilhado com ") + nomeTerapeuta);
  }
  const dicaSessao = !terapeuta ? tr("Fica marcado para você lembrar antes da análise.")
    : s.levar_sessao && terapeutaVe ? nomeTerapeuta + tr(" já vê este sonho.")
    : tr("Ao marcar, este sonho já é compartilhado com ") + nomeTerapeuta + '.';

  return (
    <div style={{ width: '100%', maxWidth: 1280, margin: '0 auto', padding: '20px 20px 0', display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-start' }}>
      <div style={{ flexBasis: '100%', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Link to={enderecoAcervo()} className="btn btn-linha" style={{ minHeight: 40 }}><Voltar size={16} />{tr(" Acervo")}</Link>
        {params.get('novo') && <span style={{ height: 28, padding: '0 10px', borderRadius: 999, background: 'var(--azul-claro)', color: 'var(--azul-escuro)', fontSize: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 6 }}><Ok size={14} />{tr(" guardado")}</span>}
      </div>
      {temLogin && !compartilhando && (
        <button type="button" className="fab fab-compartilhar so-celular" onClick={() => setCompartilhando(true)} aria-label={tr("Compartilhar este sonho")}>
          <Compartilhar size={24} />
        </button>
      )}
      {compartilhando && <CompartilharSonho s={s} mudar={mudar} aoFechar={() => setCompartilhando(false)} />}
      {sugestao && (
        <Janela titulo={tr("Temas automáticos")} aoFechar={() => setSugestao(null)}>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--muted)' }}>{semViuvas(tr("Marque o que faz sentido para você. Nada entra no sonho sem a sua confirmação."))}</p>
          <section aria-labelledby="t-sug-acervo" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h3 id="t-sug-acervo" className="rotulo">{tr("Dos seus temas")}</h3>
            {sugestao.doAcervo.length
              ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{sugestao.doAcervo.map(chipSugestao)}</div>
              : <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>{semViuvas(sugestao.buscando ? tr("Procurando…") : tr("Nenhum tema que você já usa aparece neste relato."))}</p>}
          </section>
          <section aria-labelledby="t-sug-novos" style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
            <h3 id="t-sug-novos" className="rotulo">{tr("Sugestões novas")}</h3>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--muted)' }}>{semViuvas(usuario ? tr("Símbolos comuns em sonhos e temas propostos por IA a partir do relato. A IA só nomeia o que está no sonho, não interpreta.") : tr("Símbolos comuns em sonhos que aparecem no relato."))}</p>
            {(sugestao.novos.length + sugestao.ia.length) > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{[...sugestao.novos, ...sugestao.ia].map(chipSugestao)}</div>}
            {sugestao.buscando
              ? <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}><Faisca size={14} />{tr(" Buscando mais sugestões…")}</p>
              : !(sugestao.novos.length + sugestao.ia.length) && <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)' }}>{tr("Nenhuma sugestão nova.")}</p>}
          </section>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-linha" onClick={() => setSugestao(null)}>{tr("Agora não")}</button>
            <button type="button" className="btn btn-azul" onClick={aceitarSugestao} disabled={!sugestao.marcados.length}>
              <Ok size={16} /> {sugestao.marcados.length === 1 ? tr("Adicionar 1 tema") : sugestao.marcados.length ? tr("Adicionar ") + sugestao.marcados.length + tr(' temas') : tr("Nenhum marcado")}
            </button>
          </div>
        </Janela>
      )}

      <article className="painel" style={{ flex: '999 1 560px', minWidth: 0, padding: 'clamp(20px, 4vw, 36px)', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {editandoData ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <label htmlFor="quando" className="rotulo">{tr("Quando sonhou")}</label>
            <input id="quando" type="datetime-local" value={paraCampoData(s.sonhado_em)}
              onChange={(e) => { const iso = deCampoData(e.target.value); if (iso) mudar({ sonhado_em: iso }); }}
              style={{ height: 40, padding: '0 10px', border: '1px solid var(--line-strong)', borderRadius: 10, fontSize: 15 }} />
            <button type="button" className="btn btn-linha" style={{ minHeight: 40 }} onClick={() => setEditandoData(false)}><Ok size={16} />{tr(" ok")}</button>
          </div>
        ) : (
          <button type="button" className="data-editavel" onClick={() => setEditandoData(true)} aria-label={tr("Data do sonho: ") + dataLonga(s.sonhado_em) + tr('. Mudar a data')}>
            <Calendario size={14} /> {dataLonga(s.sonhado_em)} <span className="data-mudar">{tr("mudar")}</span>
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label className="sr" htmlFor="titulo">{tr("Título")}</label>
          <input id="titulo" value={s.titulo} onChange={(e) => mudar({ titulo: e.target.value })} placeholder={tr("Sem título")}
            className="titulo-m" style={{ border: 0, padding: 0, outline: 'none', flex: 1, minWidth: 0, background: 'transparent', fontFamily: 'var(--sans)' }} />
          <BotaoFavorito s={s} size={26} style={{ width: 44, height: 44 }} aoMudar={(v) => mudar({ favorito: v }, true)} />
        </div>

        {s.audio && (
          <div style={{ background: '#F7F8FA', borderRadius: 12, padding: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            {audioFalhou
              ? <span style={{ flex: 1, fontSize: 13, color: 'var(--muted)', padding: 8 }}>{tr("Este navegador não toca esse formato de áudio. ")}<a href={audioUrl} download={s.audio.nome || 'audio'}>{tr("Baixar o áudio")}</a></span>
              : audioUrl ? <audio src={audioUrl} controls onError={() => setAudioFalhou(true)} style={{ flex: 1, height: 40 }} /> : <span style={{ fontSize: 13, color: 'var(--muted)', padding: 8 }}>{tr("Carregando o áudio…")}</span>}
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>{duracao(s.audio.duracao)}</span>
          </div>
        )}
        <Imagens imagens={s.imagens || []} urlDe={urlImagem} aoAdicionar={adicionarImagens} aoTirar={tirarImagem} />
        {s.audio && transcricaoNoServidor && usuario && iaLigada() && (
          <button type="button" className="btn btn-tracejado" style={{ alignSelf: 'flex-start' }} onClick={transcrever} disabled={transcrevendo}>
            {transcrevendo ? tr("Transcrevendo o áudio…") : s.texto ? tr("Transcrever o áudio de novo (soma ao texto)") : tr("Transformar o áudio em texto")}
          </button>
        )}

        <label className="sr" htmlFor="relato">{tr("Relato do sonho")}</label>
        <textarea id="relato" ref={relato} value={s.texto} onChange={(e) => mudar({ texto: e.target.value })} placeholder={tr("O que você lembra do sonho…")} rows={8}
          className="leitura" style={{ border: 0, padding: 0, resize: 'none', overflow: 'hidden', outline: 'none', width: '100%', maxWidth: 680, background: 'transparent', fontSize: 19, lineHeight: 1.75 }} />

        <section aria-labelledby="t-temas" style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid var(--line)', paddingTop: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h2 id="t-temas" className="rotulo" style={{ marginRight: 'auto' }}>{tr("Temas")}</h2>
            <button type="button" className="btn btn-linha" style={{ minHeight: 34, fontSize: 13 }} onClick={temasAutomaticos}><Faisca size={14} />{tr(" Temas automáticos")}</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            {s.temas.map((t) => (
              <span key={t} style={{ ...estiloTema(t), height: 30, padding: '0 2px 0 10px', borderRadius: 6, fontSize: 13.5, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 2 }}>{t}
                <button type="button" onClick={() => mudar({ temas: s.temas.filter((x) => x !== t) }, true)} aria-label={tr("Tirar o tema ") + t} style={{ width: 28, height: 28, border: 0, background: 'transparent', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'inherit', opacity: 0.6 }}><Fechar size={12} /></button>
              </span>
            ))}
            <form onSubmit={(e) => { e.preventDefault(); addTema(novoTema); }} style={{ display: 'inline-flex' }}>
              <label className="sr" htmlFor="novo-tema">{tr("Novo tema")}</label>
              <input id="novo-tema" value={novoTema} onChange={(e) => setNovoTema(e.target.value)} placeholder={tr("+ novo tema")} list="temas-existentes"
                style={{ height: 32, width: 140, padding: '0 12px', border: '1.5px dashed var(--node)', borderRadius: 999, fontSize: 13 }} />
              <datalist id="temas-existentes">{contarTemas(sonhos).map((t) => <option key={t.nome} value={t.nome} />)}</datalist>
            </form>
          </div>
        </section>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span className="rotulo" id="t-status">{tr("Status")}</span>
            <div role="radiogroup" aria-labelledby="t-status" className="abas">
              {Object.entries(STATUS).map(([k, v]) => (
                <button key={k} type="button" role="radio" aria-checked={s.status === k} className={'aba' + (s.status === k ? ' ativa' : '')} onClick={() => mudar({ status: k }, true)}>
                  <span className="ponto" style={{ background: v.cor }} />{v.rotulo}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span className="rotulo" id="t-cor">{tr("Cor no mural")}</span>
            <div role="radiogroup" aria-labelledby="t-cor" style={{ display: 'flex', gap: 6 }}>
              {Object.entries(CORES).map(([k, v]) => (
                <button key={k} type="button" role="radio" aria-checked={s.cor === k} aria-label={k} onClick={() => mudar({ cor: k }, true)}
                  style={{ width: 32, height: 32, borderRadius: 999, background: v.fundo, border: s.cor === k ? '2px solid var(--ink)' : '1px solid var(--line-strong)' }} />
              ))}
            </div>
          </div>
        </div>

        {parecidos.length > 0 && (
          <section aria-labelledby="t-parecidos" style={{ borderTop: '1px solid var(--line)', paddingTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h2 id="t-parecidos" className="rotulo">{tr("Outros sonhos com os mesmos temas")}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {parecidos.map((x) => { const c = CORES[x.cor] || CORES.branco; return (
                <Link key={x.id} to={'/app/sonho/' + x.id} style={{ background: c.fundo, borderRadius: 12, boxShadow: 'var(--shadow-card)', padding: 12, color: 'var(--ink)', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span className="rotulo-forte" style={{ color: c.rotulo }}>{dataCurta(x.sonhado_em)}</span>
                  <span style={{ fontSize: 14, fontWeight: 800 }}>{tituloDe(x)}</span>
                </Link>); })}
            </div>
          </section>
        )}
      </article>

      <aside aria-labelledby="t-conc" style={{ flex: '1 1 340px', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="painel" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h2 id="t-conc" style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em' }}>{tr("Amplificações")}</h2>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>{(s.conclusoes || []).length || 'nenhuma'} {(s.conclusoes || []).length === 1 ? tr("anotação") : (s.conclusoes || []).length ? tr("anotações") : 'ainda'}</span>
          </div>
          <label className="sr" htmlFor="conclusao">{tr("Nova amplificação")}</label>
          <textarea id="conclusao" value={conclusao} onChange={(e) => setConclusao(e.target.value)} placeholder={tr("Que imagens, lembranças ou mitos esse sonho evoca?")} rows={4}
            className="leitura" style={{ border: '1px solid var(--line-strong)', borderRadius: 10, padding: '12px 14px', fontSize: 15, lineHeight: 1.6, resize: 'vertical' }} />
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            <button type="button" className="btn btn-azul" style={{ marginLeft: 'auto' }} onClick={addConclusao}><Mais size={16} />{tr(" Guardar")}</button>
          </div>
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {(s.conclusoes || []).map((c) => (
              <li key={c.id} style={{ paddingLeft: 14, borderLeft: '2px solid var(--node)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span className="rotulo-forte" style={{ color: 'var(--muted)' }}>{dataCurta(c.em)}</span>
                <p className="leitura" style={{ margin: 0, fontSize: 15.5, lineHeight: 1.65 }}>{semViuvas(c.texto)}</p>
                <button type="button" onClick={() => mudar({ conclusoes: s.conclusoes.filter((x) => x.id !== c.id) }, true)} style={{ alignSelf: 'flex-start', border: 0, background: 'transparent', color: 'var(--muted)', fontSize: 12, padding: 0, textDecoration: 'underline' }}>{tr("apagar")}</button>
              </li>
            ))}
          </ol>
        </div>
        <Comentarios sonhoId={s.id} modo="dono" veem={veem} aoMudar={recarregarComentarios} />
        <label className="painel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
          <input type="checkbox" checked={!!s.levar_sessao} onChange={(e) => levarSessao(e.target.checked)} style={{ width: 20, height: 20, accentColor: 'var(--azul)', flex: 'none' }} />
          <span style={{ fontSize: 14, lineHeight: 1.45 }}><strong>{tr("Levar para a próxima sessão")}</strong><br /><span style={{ color: 'var(--muted)' }}>{semViuvas(dicaSessao)}</span></span>
        </label>
        {!terapeuta && usuario && <BotaoConvite tipo="paciente" className="btn" style={{ alignSelf: 'flex-start', background: 'transparent', color: 'var(--azul-escuro)', fontSize: 13, padding: '0 4px', minHeight: 32, marginTop: -6 }} />}
        <p style={{ margin: 0, padding: '0 4px', fontSize: 12, lineHeight: 1.5, color: 'var(--muted)' }}>{semViuvas(tr("As amplificações são suas. O Sonhário não interpreta sonhos e não substitui a sua análise."))}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '4px 4px 0' }}>
          {temLogin && <button type="button" className="btn btn-linha" onClick={() => setCompartilhando(true)}>
            {veem.length > 0 && <span style={{ display: 'inline-flex' }}>{veem.slice(0, 3).map((p, k) => <span key={p.email} style={{ marginLeft: k ? -8 : 0, border: '2px solid #fff', borderRadius: 999, display: 'inline-flex' }}><Avatar nome={p.nome} foto={p.foto} size={22} /></span>)}</span>}
            <Compartilhar size={16} />{tr(" Compartilhar")}
          </button>}
          <button type="button" className="btn btn-linha" style={{ color: 'var(--danger)', borderColor: '#F1C4BF' }}
            onClick={() => { apagar(s.id); navegar(enderecoAcervo()); }}>
            <Lixo size={16} />{tr(" Apagar sonho")}
          </button>
        </div>
      </aside>
    </div>
  );
}

