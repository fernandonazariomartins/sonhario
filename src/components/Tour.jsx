// Tour pelos recursos, para quem recebeu um convite e ainda não entrou.
// Tudo com sonhos de exemplo: nada aqui é de alguém, e nada é salvo.
import { useMemo, useState } from 'react';
import Janela from './Janela.jsx';
import { useCorTema } from '../lib/estado.jsx';
import { sonhosDeExemplo, insightDeExemplo } from '../lib/exemplos.js';
import { contarTemas } from '../lib/sonhos.js';
import { semViuvas } from '../lib/tipografia.js';
import { NotaExemplo, MuralEmLinhas } from '../pages/Acervo.jsx';
import { Mic, Caneta, Cadeado, Pessoas, Voltar, Avancar, Mensagem } from './Icones.jsx';

const texto = { margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--muted)' };

function Gravar() {
  return (
    <div className="painel" style={{ padding: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <span style={{ width: 72, height: 72, borderRadius: 999, background: 'var(--preto)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Mic size={30} /></span>
      <span style={{ fontSize: 14, color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Caneta size={14} /> ou escreva, se preferir</span>
    </div>
  );
}

function Mural({ exemplos }) {
  return (
    <div style={{ maxHeight: 300, overflow: 'hidden', maskImage: 'linear-gradient(#000 70%, transparent)', WebkitMaskImage: 'linear-gradient(#000 70%, transparent)', pointerEvents: 'none' }}>
      <MuralEmLinhas largura={190} vao={10}>{exemplos.slice(0, 4).map((s) => <NotaExemplo key={s.id} s={s} aoAbrir={() => {}} />)}</MuralEmLinhas>
    </div>
  );
}

function Temas({ exemplos }) {
  const estiloTema = useCorTema();
  const temas = contarTemas(exemplos);
  return (
    <div className="painel" style={{ padding: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {temas.map((t) => <span key={t.nome} className="chip" style={estiloTema(t.nome)}>{t.nome} · {t.n}</span>)}
    </div>
  );
}

function Observacao() {
  const ins = insightDeExemplo('primordiais');
  const estiloTema = useCorTema();
  return (
    <div className="painel" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className="selo-exemplo">exemplo</span><span className="rotulo">{ins.nome}</span></span>
      <strong style={{ fontSize: 16 }}>{semViuvas(ins.titulo)}</strong>
      {(ins.itens || []).slice(0, 3).map((i) => (
        <span key={i.tema} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--muted)' }}>
          <span className="chip" style={estiloTema(i.tema)}>{i.tema}</span>{i.texto}
        </span>
      ))}
    </div>
  );
}

function Simbolo({ icone }) {
  return <span style={{ width: 64, height: 64, borderRadius: 999, background: 'var(--azul-claro)', color: 'var(--azul-escuro)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }}>{icone}</span>;
}

// quem: 'paciente' (vai registrar os sonhos), 'terapeuta' (vai acompanhar pacientes) ou 'amigo'.
function passos(quem, exemplos) {
  const lista = [
    { titulo: 'Registre ao acordar', texto: 'O app já abre pronto para gravar. Fale o sonho meio dormindo, ou escreva. Dá para usar no celular, instalado direto pelo site.', visual: <Gravar /> },
    { titulo: 'Seu acervo num mural', texto: 'Cada sonho vira uma nota, com cor, temas e o que você pensou sobre ele. Também em lista e num calendário.', visual: <Mural exemplos={exemplos} /> },
    { titulo: 'Temas que se repetem', texto: 'Você marca os temas de cada sonho e vê quais voltam, quais andam juntos e quais sumiram.', visual: <Temas exemplos={exemplos} /> },
    { titulo: 'Observações sobre o acervo', texto: 'Com o tempo, o app mostra padrões a partir de ideias de Jung. Não interpreta por você: aponta onde olhar.', visual: <Observacao /> },
    { titulo: 'Um sonho por vez', texto: quem === 'terapeuta'
      ? 'O paciente escolhe o que mostrar, um sonho por vez. Ao marcar “Levar para a próxima sessão”, o sonho aparece para você, e dá para comentar.'
      : 'Você escolhe o que mostrar, um sonho por vez, para o terapeuta ou para amigos. Quem recebe pode comentar.', visual: <Simbolo icone={<Mensagem size={28} />} /> },
  ];
  if (quem === 'terapeuta') lista.push({ titulo: 'A aba Pacientes', texto: 'Cada paciente aparece com quantos sonhos mostrou e quantos são para a próxima sessão. Você também pode registrar os seus próprios sonhos.', visual: <Simbolo icone={<Pessoas size={28} />} /> });
  lista.push({ titulo: 'Trancado com a sua frase-senha', texto: 'Os sonhos saem do aparelho trancados. Nem nós conseguimos ler.', visual: <Simbolo icone={<Cadeado size={28} />} /> });
  return lista;
}

export default function Tour({ quem = 'paciente', aoFechar, aoEntrar }) {
  const exemplos = useMemo(() => sonhosDeExemplo(0), []);
  const lista = useMemo(() => passos(quem, exemplos), [quem, exemplos]);
  const [i, setI] = useState(0);
  const p = lista[i];
  const ultimo = i === lista.length - 1;
  return (
    <Janela titulo="Conheça o Sonhário" aoFechar={aoFechar}>
      <span className="rotulo">{i + 1} de {lista.length}</span>
      <h2 className="titulo-m" style={{ margin: 0 }}>{semViuvas(p.titulo)}</h2>
      {p.visual}
      <p style={texto}>{semViuvas(p.texto)}</p>
      {ultimo && <a href="/demo" target="_blank" rel="noopener" style={{ fontSize: 14, color: 'var(--azul-escuro)' }}>{semViuvas('Ou explore a demonstração completa, com um acervo inventado')}</a>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span aria-hidden="true" style={{ display: 'flex', gap: 5, marginRight: 'auto' }}>
          {lista.map((_, k) => <span key={k} style={{ width: 7, height: 7, borderRadius: 999, background: k === i ? 'var(--azul)' : 'var(--line)' }} />)}
        </span>
        {i > 0 && <button type="button" className="btn btn-linha" onClick={() => setI(i - 1)} aria-label="Anterior"><Voltar size={16} /></button>}
        {ultimo
          ? <button type="button" className="btn btn-preto" onClick={aoEntrar}>Entrar com Google</button>
          : <button type="button" className="btn btn-preto" onClick={() => setI(i + 1)}>Próximo <Avancar size={16} /></button>}
      </div>
    </Janela>
  );
}
