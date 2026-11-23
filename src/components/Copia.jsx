// ⋯ › Baixar cópia do acervo: um .zip com todos os sonhos, os áudios e as imagens (veja lib/backup.js).
import { useMemo, useState } from 'react';
import Janela from './Janela.jsx';
import { useEstado } from '../lib/estado.jsx';
import { montarCopia, contarArquivos, baixar } from '../lib/backup.js';
import { semViuvas } from '../lib/tipografia.js';
import { Importar, Ok } from './Icones.jsx';

const n = (t) => semViuvas(t);
const plural = (k, um, varios) => (k === 1 ? '1 ' + um : k.toLocaleString('pt-BR') + ' ' + varios);

export default function Copia({ aoFechar }) {
  const { sonhos, lixeira, urlAudio, urlImagem, avisar } = useEstado();
  const abertos = useMemo(() => sonhos.filter((s) => !s._trancado), [sonhos]);
  const trancados = sonhos.length - abertos.length;
  const arquivos = useMemo(() => contarArquivos(abertos), [abertos]);
  const temArquivos = arquivos.audios + arquivos.imagens > 0;
  const [comArquivos, setComArquivos] = useState(true);
  const [etapa, setEtapa] = useState(''); // '' | 'baixando' | 'montando' | 'pronto'
  const [progresso, setProgresso] = useState({ feitos: 0, total: 0 });
  const [falhas, setFalhas] = useState(0);

  async function gerar() {
    setEtapa('baixando');
    try {
      const r = await montarCopia(abertos, { urlAudio, urlImagem }, {
        comArquivos: comArquivos && temArquivos,
        aoAvancar: (feitos, total) => { setProgresso({ feitos, total }); if (feitos === total) setEtapa('montando'); },
      });
      baixar(r.blob, r.nome);
      setFalhas(r.falhas);
      setEtapa('pronto');
    } catch (e) {
      setEtapa('');
      avisar('Não deu para montar a cópia: ' + e.message);
    }
  }

  const ocupado = etapa === 'baixando' || etapa === 'montando';
  const partesArquivos = [arquivos.audios && plural(arquivos.audios, 'áudio', 'áudios'), arquivos.imagens && plural(arquivos.imagens, 'imagem', 'imagens')].filter(Boolean).join(' e ');

  return (
    <Janela titulo="Baixar cópia do acervo" aoFechar={ocupado ? () => {} : aoFechar}>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--muted)' }}>
        {n('Um arquivo .zip com todos os seus sonhos: para ler em qualquer lugar e para restaurar no Sonhário se precisar, nesta conta ou em outra.')}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '14px 16px', borderRadius: 12, background: 'var(--cinza)' }}>
        <strong style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>{plural(abertos.length, 'sonho', 'sonhos')}</strong>
        <span style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.5 }}>
          {n('Com temas, status, favoritos e amplificações' + (temArquivos ? ', mais ' + partesArquivos : '') + '.' + (lixeira.length ? ' A lixeira fica de fora.' : ''))}
        </span>
      </div>

      {temArquivos && (
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14.5, lineHeight: 1.5 }}>
          <input type="checkbox" checked={comArquivos} disabled={ocupado} onChange={(e) => setComArquivos(e.target.checked)} style={{ marginTop: 4 }} />
          <span>Incluir áudios e imagens<br /><span style={{ fontSize: 13, color: 'var(--muted)' }}>{n('Sem eles, o arquivo fica bem menor e sai na hora.')}</span></span>
        </label>
      )}

      {trancados > 0 && <div className="aviso">{n(`${plural(trancados, 'sonho não abriu', 'sonhos não abriram')} neste aparelho e ${trancados === 1 ? 'fica' : 'ficam'} de fora. Recarregue a página e tente de novo.`)}</div>}

      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: 'var(--muted)' }}>
        {n('A cópia é montada aqui no aparelho e sai aberta, sem a criptografia do app. Guarde num lugar só seu.')}
      </p>

      {etapa === 'pronto' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, color: 'var(--azul)' }}><Ok size={18} /> Cópia baixada</div>
          {falhas > 0 && <div className="aviso">{n(`${plural(falhas, 'anexo não baixou', 'anexos não baixaram')} e ficou de fora. Os textos estão completos; se quiser, tente de novo com a internet mais firme.`)}</div>}
          <span style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.5 }}>{n('Para restaurar: ⋯ › Importar sonhos, e envie o .zip inteiro.')}</span>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-preto" onClick={aoFechar}>Fechar</button>
            <button type="button" className="btn btn-linha" onClick={gerar}>Baixar de novo</button>
          </div>
        </div>
      ) : (
        <button type="button" className="btn btn-preto btn-grande" disabled={ocupado || !abertos.length} onClick={gerar} aria-live="polite">
          <Importar size={18} />
          {etapa === 'baixando' ? `Juntando os anexos… ${progresso.feitos}/${progresso.total}` : etapa === 'montando' ? 'Montando o arquivo…' : 'Baixar cópia (.zip)'}
        </button>
      )}
    </Janela>
  );
}
