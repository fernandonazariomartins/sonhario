import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEstado } from '../lib/estado.jsx';
import { lerArquivos, deKeepJSON, combinarComAcervo } from '../lib/importar.js';
import { tituloDe, dataCurta } from '../lib/sonhos.js';
import { guardarMidia } from '../lib/midia.js';
import { semViuvas } from '../lib/tipografia.js';
import { Mic, Imagem } from '../components/Icones.jsx';
import { tr } from '../lib/i18n.js';

const anexosDe = (s) => s._midia ? { audios: s.audio ? 0 : Math.min(1, s._midia.audios.length), imagens: s._midia.imagens.length, faltando: s._midia.faltando } : { audios: 0, imagens: 0, faltando: 0 };

export default function Importar() {
  const { sonhos, salvarVarios, avisar, salvarAudio, salvarImagem } = useEstado();
  const navegar = useNavigate();
  const [lido, setLido] = useState(null); // { sonhos, keep, marcadores }
  const [marcados, setMarcados] = useState([]);
  const [pularRepetidos, setPularRepetidos] = useState(true);
  const [importando, setImportando] = useState(null); // { feitos, total } enquanto guarda os anexos

  async function escolher(e) {
    const arquivos = [...e.target.files];
    if (!arquivos.length) return;
    const r = await lerArquivos(arquivos);
    setLido(r);
    setMarcados(r.marcadores);
  }

  const doKeep = lido ? lido.keep.map((o) => deKeepJSON(o, marcados.length ? marcados : null, lido.midias)).filter(Boolean) : [];
  const todos = lido ? [...lido.sonhos, ...doKeep] : [];
  const { novos, completar, pulados } = combinarComAcervo(todos, sonhos, pularRepetidos);
  const finais = [...novos, ...completar];
  const comRelato = completar.filter((s) => s._motivo === 'relato').length;
  const comAnexos = completar.length - comRelato;
  const total = finais.reduce((t, s) => { const a = anexosDe(s); return { audios: t.audios + a.audios, imagens: t.imagens + a.imagens, faltando: t.faltando + a.faltando }; }, { audios: 0, imagens: 0, faltando: 0 });

  async function importar() {
    // Primeiro os anexos de cada sonho (áudio e imagens), depois todos os sonhos de uma vez.
    const comMidia = finais.filter((s) => s._midia);
    setImportando({ feitos: 0, total: comMidia.length });
    const prontos = [];
    let feitos = 0;
    for (const x of finais) {
      const { _motivo, ...s } = x; // eslint-disable-line no-unused-vars
      if (s._midia) { prontos.push(await guardarMidia(s, { salvarAudio, salvarImagem })); setImportando({ feitos: ++feitos, total: comMidia.length }); }
      else prontos.push(s);
    }
    await salvarVarios(prontos);
    setImportando(null);
    const partes = [];
    if (novos.length) partes.push(novos.length === 1 ? tr("1 sonho importado") : novos.length + tr(" sonhos importados"));
    if (comRelato) partes.push(comRelato === 1 ? tr("1 completado com o relato") : comRelato + tr(" completados com o relato"));
    if (comAnexos) partes.push(comAnexos === 1 ? tr("1 completado com os anexos") : comAnexos + tr(" completados com os anexos"));
    avisar(partes.join(' · '));
    navegar('/app/acervo');
  }

  return (
    <div style={{ width: '100%', maxWidth: 1000, margin: '0 auto', padding: '24px 20px 0', display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 className="titulo-m">{tr("Traga os sonhos que você já anotou")}</h1>
        <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}>{semViuvas(tr("Nada entra no seu acervo sem você conferir antes."))}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
        <div className="painel" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>{'Notion'}</h2>
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.55, color: 'var(--muted)' }}>
            <li>{tr("Abra a tabela de sonhos no Notion.")}</li>
            <li>{tr("No menu ••• escolha ")}<strong>{tr("Exportar")}</strong> › <strong>{tr("Markdown e CSV")}</strong>{tr(", com ")}<strong>{tr("Incluir subpáginas")}</strong>{tr(" ligado.")}</li>
            <li>{tr("Envie o arquivo ")}<strong>{'.zip'}</strong>{tr(" inteiro aqui, sem descompactar. É nele que estão os relatos.")}</li>
          </ol>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--azul)' }}>{tr("Reconhece o template Meu Sonhário")}</span>
        </div>
        <div className="painel" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>{tr("Google Keep")}</h2>
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.55, color: 'var(--muted)' }}>
            <li>{tr("Em ")}<a href="https://takeout.google.com" target="_blank" rel="noopener noreferrer">{'takeout.google.com'}</a>{tr(", marque só o Keep.")}</li>
            <li>{tr("Envie o ")}<strong>{'.zip'}</strong>{tr(" do Takeout inteiro, ou as notas ")}<strong>{'.json'}</strong>{tr(" junto com as imagens e os áudios delas.")}</li>
            <li>{tr("Escolha os marcadores que são de sonho.")}</li>
          </ol>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--azul)' }}>{tr("Traz as imagens e os áudios das notas")}</span>
        </div>
        <div className="painel" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>{tr("Texto ou Markdown")}</h2>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--muted)' }}>{semViuvas(tr("Um arquivo .txt ou .md. Cada título (## Sonho) ou cada parágrafo que começa com uma data (16/11/2026) vira um sonho."))}</p>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--muted)' }}>{semViuvas(tr("Tem imagens e áudios? Envie um .zip com o .md e a pasta dos anexos: os links do .md levam cada arquivo para o seu sonho."))}</p>
        </div>
      </div>

      <label className="btn btn-preto btn-grande" style={{ alignSelf: 'flex-start' }}>
        {tr("Escolher arquivos")}
        <input type="file" multiple accept=".zip,.csv,.json,.txt,.md,image/*,audio/*,.3gp,.amr,.m4a" onChange={escolher} className="sr" />
      </label>

      {lido && (
        <div className="painel" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {lido.marcadores.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="rotulo">{tr("Marcadores do Keep que são de sonho")}</span>
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
            <div className="aviso">{semViuvas(tr("Este arquivo .csv traz só o título, a data e os temas. O texto de cada sonho fica nas páginas do Notion: envie o .zip do export para trazer os relatos também."))}</div>
          )}
          {total.faltando > 0 && (
            <div className="aviso">{semViuvas((total.faltando === 1 ? tr("1 anexo citado nas notas não veio") : total.faltando + tr(" anexos citados nas notas não vieram")) + tr(" nos arquivos enviados. Para trazer, envie o .zip inteiro, com as imagens e os áudios."))}</div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
            <strong style={{ fontSize: 16 }}>{novos.length === 1 ? tr("1 sonho novo") : novos.length + tr(" sonhos novos")}{comRelato > 0 && ' · ' + comRelato + tr(" para completar com o relato")}{comAnexos > 0 && ' · ' + comAnexos + tr(" para completar com os anexos")}{(total.audios + total.imagens) > 0 && <span style={{ fontWeight: 500, color: 'var(--muted)' }}>{' · ' + [total.audios && (total.audios === 1 ? tr("1 áudio") : total.audios + tr(" áudios")), total.imagens && (total.imagens === 1 ? tr("1 imagem") : total.imagens + tr(' imagens'))].filter(Boolean).join(' e ')}</span>}{pulados > 0 && <span style={{ fontWeight: 500, color: 'var(--muted)' }}>{' · ' + (pulados === 1 ? tr("1 já está") : pulados + tr(" já estão")) + tr(" no Sonhário")}</span>}</strong>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14 }}><input type="checkbox" checked={pularRepetidos} onChange={(e) => setPularRepetidos(e.target.checked)} />{tr(" Pular sonhos que já estão no Sonhário")}</label>
            <button className="btn btn-azul" style={{ marginLeft: 'auto' }} disabled={!finais.length || !!importando} onClick={importar}>{importando ? (importando.total ? tr("Guardando anexos… {0}/{1}", [importando.feitos, importando.total]) : tr("Importando…")) : tr("Importar ") + finais.length}</button>
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', maxHeight: 320, overflow: 'auto', borderTop: '1px solid var(--line)' }}>
            {finais.slice(0, 200).map((s) => (
              <li key={s.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--line)', display: 'flex', gap: 12, fontSize: 14 }}>
                <span style={{ color: 'var(--muted)', width: 90, flex: 'none' }}>{dataCurta(s.sonhado_em)}</span>
                <span style={{ fontWeight: 700 }}>{tituloDe(s)}</span>
                {anexosDe(s).audios > 0 && <span title={tr("Com áudio")} style={{ color: 'var(--muted)', display: 'inline-flex', alignItems: 'center' }}><Mic size={14} /></span>}
                {anexosDe(s).imagens > 0 && <span title={anexosDe(s).imagens === 1 ? tr("Com 1 imagem") : tr("Com ") + anexosDe(s).imagens + tr(' imagens')} style={{ color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12 }}><Imagem size={14} />{anexosDe(s).imagens > 1 && anexosDe(s).imagens}</span>}
                <span style={{ color: 'var(--muted)', marginLeft: 'auto' }}>{s.temas.join(', ')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
