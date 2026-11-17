import { useState } from 'react';

// Foto da conta Google da pessoa; sem foto, a inicial do nome.
export default function Avatar({ nome = '', foto = '', size = 40 }) {
  const [falhou, setFalhou] = useState(false);
  const base = { width: size, height: size, borderRadius: 999, flex: 'none' };
  if (foto && !falhou) return <img src={foto} alt="" referrerPolicy="no-referrer" onError={() => setFalhou(true)} style={{ ...base, objectFit: 'cover', background: 'var(--cinza)' }} />;
  return <span aria-hidden="true" style={{ ...base, background: 'var(--preto)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: Math.round(size * 0.4) }}>{(nome || '?').trim().charAt(0).toUpperCase()}</span>;
}
