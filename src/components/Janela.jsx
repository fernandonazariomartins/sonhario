import { useEffect } from 'react';
import { Fechar } from './Icones.jsx';

export default function Janela({ titulo, aoFechar, children }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && aoFechar();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [aoFechar]);
  return (
    <div className="fundo-janela" onClick={(e) => e.target === e.currentTarget && aoFechar()}>
      <div className="janela" role="dialog" aria-modal="true" aria-label={titulo}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <h2 style={{ fontSize: 26, fontWeight: 400, letterSpacing: '-0.03em', lineHeight: 1.1, marginRight: 'auto' }}>{titulo}</h2>
          <button type="button" className="btn-icone" onClick={aoFechar} aria-label="Fechar"><Fechar size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
