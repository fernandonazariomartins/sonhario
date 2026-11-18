import { useState } from 'react';
import Janela from './Janela.jsx';
import { iaLigada, ligarIA } from '../lib/ia.js';
import { transcricaoNoServidor } from '../lib/transcrever.js';
import { semViuvas as n } from '../lib/tipografia.js';

export default function JanelaIA({ aoFechar }) {
  const [ligada, setLigada] = useState(iaLigada);
  const mudar = (v) => { ligarIA(v); setLigada(v); };
  return (
    <Janela titulo="Inteligência artificial" aoFechar={aoFechar}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
        <p style={{ margin: 0, lineHeight: 1.6 }}>{n('Seus sonhos ficam trancados. Mas, para sugerir temas' + (transcricaoNoServidor ? ' e transcrever áudios no iPhone' : '') + ', a IA precisa ler: o relato' + (transcricaoNoServidor ? ' ou o áudio' : '') + ' daquele sonho sai aberto do aparelho e vai para a OpenAI.')}</p>
        <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--muted)' }}>{n('A OpenAI não usa esses dados para treinar modelos. Mesmo assim, fica desligado até você ligar, e só vale para este aparelho. Desligado, os temas automáticos usam só os seus temas e o dicionário do app, sem sair daqui.')}</p>
        <div role="radiogroup" aria-label="IA" style={{ display: 'flex', gap: 8 }}>
          <button type="button" role="radio" aria-checked={!ligada} className={'aba' + (!ligada ? ' ativa' : '')} onClick={() => mudar(false)}>Desligada</button>
          <button type="button" role="radio" aria-checked={ligada} className={'aba' + (ligada ? ' ativa' : '')} onClick={() => mudar(true)}>Ligada</button>
        </div>
        <button type="button" className="btn btn-preto" onClick={aoFechar}>Pronto</button>
      </div>
    </Janela>
  );
}
