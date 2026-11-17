import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEstado } from '../lib/estado.jsx';
import { lerArquivos, deKeepJSON } from '../lib/importar.js';
import { tituloDe, dataCurta } from '../lib/sonhos.js';
import { semViuvas } from '../lib/tipografia.js';

export default function Importar() {
  const { sonhos, salvarVarios, avisar } = useEstado();
  const navegar = useNavigate();
  const [lido, setLido] = useState(null); // { sonhos, keep, marcadores }
  const [marcados, setMarcados] = useState([]);
  const [pularRepetidos, setPularRepetidos] = useState(true);
  const [importando, setImportando] = useState(false);

  async function escolher(e) {
    const arquivos = [...e.target.files];
    if (!arquivos.length) return;
    const r = await lerArquivos(arquivos);
    setLido(r);
    setMarcados(r.marcadores);
  }

  const doKeep = lido ? lido.keep.map((o) => deKeepJSON(o, marcados.length ? marcados : null)).filter(Boolean) : [];
  const todos = lido ? [...lido.sonhos, ...doKeep] : [];
  const chave = (s) => (tituloDe(s) + '|' + s.sonhado_em.slice(0, 10)).toLowerCase();
  const existentes = new Map(sonhos.map((s) => [chave(s), s]));
  // Sonho que já está no Sonhário, mas sem o relato (ex.: veio só do CSV): completa em vez de duplicar.
  const completar = todos.flatMap((s) => {
    const e = existentes.get(chave(s));
    return e && !e.texto?.trim() && s.texto?.trim()
      ? [{ ...e, texto: s.texto, temas: [...new Set([...(e.temas || []), ...s.temas])] }]
      : [];
  });
  const novos = pularRepetidos ? todos.filter((s) => !existentes.has(chave(s))) : todos;
  const finais = [...novos, ...completar];

  async function importar() {
    setImportando(true);
    await salvarVarios(finais);
    setImportando(false);
    const partes = [];
    if (novos.length) partes.push(novos.length === 1 ? '1 sonho importado' : novos.length + ' sonhos importados');
    if (completar.length) partes.push(completar.length === 1 ? '1 completado com o relato' : completar.length + ' completados com o relato');
    avisar(partes.join(' · '));
    navegar('/app/acervo');
  }

  return (
    <div style={{ width: '100%', maxWidth: 1000, margin: '0 auto', padding: '24px 20px 0', display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 className="titulo-m">Traga os sonhos que você já anotou</h1>
        <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}>{semViuvas('Nada entra no seu acervo sem você conferir antes.')}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
        <div className="painel" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Notion</h2>
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.55, color: 'var(--muted)' }}>
            <li>Abra a tabela de sonhos no Notion.</li>
            <li>No menu ••• escolha <strong>Exportar</strong> › <strong>Markdown e CSV</strong>, com <strong>Incluir subpáginas</strong> ligado.</li>
            <li>Envie o arquivo <strong>.zip</strong> inteiro aqui, sem descompactar. É nele que estão os relatos.</li>
          </ol>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--azul)' }}>Reconhece o template Meu Sonhário</span>
        </div>
        <div className="painel" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Google Keep</h2>
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.55, color: 'var(--muted)' }}>
            <li>Em <a href="https://takeout.google.com" target="_blank" rel="noopener noreferrer">takeout.google.com</a>, marque só o Keep.</li>
            <li>Baixe e descompacte o arquivo.</li>
            <li>Envie as notas <strong>.json</strong> e escolha os marcadores que são de sonho.</li>
          </ol>
        </div>
        <div className="painel" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Texto ou Markdown</h2>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--muted)' }}>{semViuvas('Um arquivo .txt ou .md. Cada parágrafo que começa com uma data (16/11/2026) vira um sonho.')}</p>
        </div>
      </div>

      <label className="btn btn-preto btn-grande" style={{ alignSelf: 'flex-start' }}>
        Escolher arquivos
        <input type="file" multiple accept=".zip,.csv,.json,.txt,.md" onChange={escolher} className="sr" />
      </label>

      {lido && (
        <div className="painel" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {lido.marcadores.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="rotulo">Marcadores do Keep que são de sonho</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {lido.marcadores.map((m) => (
                  <label key={m} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 12px', borderRadius: 999, border: '1px solid var(--line-strong)', fontSize: 14 }}>
                    <input type="checkbox" checked={marcados.includes(m)} onChange={(e) => setMarcados(e.target.checked ? [...marcados, m] : marcados.filter((x) => x !== m))} />{m}
                  </label>
                ))}
              </div>
            </div>
          )}
          {lido.soCSV && (
            <div className="aviso">{semViuvas('Este arquivo .csv traz só o título, a data e os temas. O texto de cada sonho fica nas páginas do Notion: envie o .zip do export para trazer os relatos também.')}</div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
            <strong style={{ fontSize: 16 }}>{novos.length === 1 ? '1 sonho novo' : novos.length + ' sonhos novos'}{completar.length > 0 && ' · ' + completar.length + ' para completar com o relato'}</strong>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14 }}><input type="checkbox" checked={pularRepetidos} onChange={(e) => setPularRepetidos(e.target.checked)} /> Pular sonhos que já estão no Sonhário</label>
            <button className="btn btn-azul" style={{ marginLeft: 'auto' }} disabled={!finais.length || importando} onClick={importar}>{importando ? 'Importando…' : 'Importar ' + finais.length}</button>
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', maxHeight: 320, overflow: 'auto', borderTop: '1px solid var(--line)' }}>
            {finais.slice(0, 200).map((s) => (
              <li key={s.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--line)', display: 'flex', gap: 12, fontSize: 14 }}>
                <span style={{ color: 'var(--muted)', width: 90, flex: 'none' }}>{dataCurta(s.sonhado_em)}</span>
                <span style={{ fontWeight: 700 }}>{tituloDe(s)}</span>
                <span style={{ color: 'var(--muted)', marginLeft: 'auto' }}>{s.temas.join(', ')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
