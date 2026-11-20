import { Link } from 'react-router-dom';
import { useEstado } from '../lib/estado.jsx';
import { dataCurta, tituloDe, diasRestantes, DIAS_LIXEIRA } from '../lib/sonhos.js';
import { Lixo, Restaurar } from '../components/Icones.jsx';
import { semViuvas } from '../lib/tipografia.js';

function prazo(s) {
  const d = diasRestantes(s);
  return d <= 1 ? 'some amanhã' : `some em ${d} dias`;
}

export default function Lixeira() {
  const { lixeira, restaurar, apagarDeVez, sonhos, apagarTodos } = useEstado();

  function esvaziar() {
    const n = lixeira.length;
    if (!confirm(`Apagar de vez ${n === 1 ? '1 sonho' : n + ' sonhos'}, com áudios e amplificações? Não dá para desfazer.`)) return;
    apagarDeVez(lixeira.map((s) => s.id));
  }

  async function apagarTudo() {
    const n = sonhos.length;
    const r = prompt(`Isso manda os ${n === 1 ? '1 sonho' : n + ' sonhos'} do seu acervo para a lixeira. Ficam lá por ${DIAS_LIXEIRA} dias e depois somem de vez, com áudios e amplificações.\n\nPara confirmar, digite APAGAR:`);
    if ((r || '').trim().toUpperCase() !== 'APAGAR') return;
    await apagarTodos();
  }

  return (
    <div style={{ width: '100%', maxWidth: 880, margin: '0 auto', padding: '24px 20px 0', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
        <h1 className="titulo-m" style={{ marginRight: 'auto' }}>Lixeira</h1>
        {lixeira.length > 1 && <button type="button" className="btn btn-linha" onClick={() => restaurar(lixeira.map((s) => s.id))}><Restaurar size={16} /> Restaurar todos</button>}
        {lixeira.length > 0 && <button type="button" className="btn btn-linha" style={{ color: 'var(--danger)', borderColor: '#F1C4BF' }} onClick={esvaziar}><Lixo size={16} /> Esvaziar lixeira</button>}
      </div>
      <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6, maxWidth: 560 }}>
        {semViuvas(`Os sonhos apagados ficam aqui por ${DIAS_LIXEIRA} dias. Depois disso somem de vez, com o áudio e as amplificações.`)}
      </p>

      {lixeira.length === 0 ? (
        <div className="painel" style={{ padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <p style={{ margin: 0, color: 'var(--muted)' }}>A lixeira está vazia.</p>
          <Link className="btn btn-linha" to="/app/acervo">Voltar ao acervo</Link>
        </div>
      ) : (
        <div className="painel" style={{ overflow: 'hidden' }}>
          {lixeira.map((s, i) => {
            return (
              <div key={s.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 14px', padding: '14px 16px', borderTop: i ? '1px solid var(--line)' : 0 }}>
                <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                  <div className="sigilo" style={{ fontWeight: 800, color: s.titulo?.trim() ? 'var(--ink)' : 'var(--muted)' }}>{tituloDe(s)}</div>
                  {s.texto && <div className="sigilo" style={{ fontFamily: 'var(--serif)', color: 'var(--muted)', fontSize: 13, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.texto}</div>}
                  <div className="rotulo" style={{ marginTop: 6, fontSize: 11 }}>sonhado {dataCurta(s.sonhado_em)} · {prazo(s)}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn btn-linha" style={{ minHeight: 36 }} onClick={() => restaurar([s.id])}><Restaurar size={16} /> Restaurar</button>
                  <button type="button" className="btn-icone" style={{ width: 36, height: 36, color: 'var(--danger)' }} aria-label="Apagar de vez"
                    onClick={() => { if (confirm('Apagar este sonho de vez? Não dá para desfazer.')) apagarDeVez([s.id]); }}><Lixo size={16} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {sonhos.length > 0 && (
        <section style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--line)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 16px' }}>
          <div style={{ flex: '1 1 300px', minWidth: 0 }}>
            <div style={{ fontWeight: 800 }}>Apagar todos os sonhos</div>
            <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 14, lineHeight: 1.6, maxWidth: 520 }}>
              {semViuvas(`Manda o acervo inteiro para a lixeira de uma vez. Dá para restaurar em até ${DIAS_LIXEIRA} dias.`)}
            </p>
          </div>
          <button type="button" className="btn btn-linha" style={{ color: 'var(--danger)', borderColor: '#F1C4BF' }} onClick={apagarTudo}>
            <Lixo size={16} /> Apagar todos ({sonhos.length})
          </button>
        </section>
      )}
    </div>
  );
}
