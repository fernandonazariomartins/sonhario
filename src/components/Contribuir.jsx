import { useState } from 'react';
import Janela from './Janela.jsx';
import { enviarIdeia } from '../lib/contribuir.js';
import { semViuvas } from '../lib/tipografia.js';
import { Ok, Mensagem } from './Icones.jsx';

export default function Contribuir({ aoFechar }) {
  const [mensagem, setMensagem] = useState('');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [estado, setEstado] = useState(''); // '', 'enviando', 'enviado', 'email', 'erro'

  async function enviar(e) {
    e.preventDefault();
    if (!mensagem.trim()) return;
    setEstado('enviando');
    try { setEstado(await enviarIdeia({ mensagem: mensagem.trim(), nome: nome.trim(), email: email.trim() })); }
    catch { setEstado('erro'); }
  }

  if (estado === 'enviado') return (
    <Janela titulo="Ideia enviada" aoFechar={aoFechar}>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--muted)' }}>{semViuvas('Obrigado! A mensagem chegou para o Fernando. Se você deixou o e-mail, ele pode responder por lá.')}</p>
      <button type="button" className="btn btn-azul btn-grande" onClick={aoFechar}><Ok size={18} /> Fechar</button>
    </Janela>
  );

  return (
    <Janela titulo="Contribuir com uma ideia" aoFechar={aoFechar}>
      <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--muted)' }}>{semViuvas('O Sonhário é um projeto colaborativo e cresce com quem usa. Teve uma ideia, sentiu falta de algo ou achou um erro? Escreva aqui: a mensagem vai direto para o Fernando.')}</p>
      <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label className="sr" htmlFor="ideia">Sua ideia</label>
        <textarea id="ideia" className="campo" rows={5} value={mensagem} onChange={(e) => setMensagem(e.target.value)} placeholder="Seria bom se o Sonhário…" required style={{ fontSize: 15, lineHeight: 1.55, resize: 'vertical' }} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <label className="sr" htmlFor="ideia-nome">Seu nome</label>
          <input id="ideia-nome" className="campo" style={{ flex: '1 1 160px', height: 44 }} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome (opcional)" />
          <label className="sr" htmlFor="ideia-email">Seu e-mail</label>
          <input id="ideia-email" type="email" className="campo" style={{ flex: '1 1 200px', height: 44 }} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail para resposta (opcional)" />
        </div>
        {estado === 'erro' && <div className="aviso">Não deu para enviar agora. Tente de novo em instantes.</div>}
        {estado === 'email' && <div className="aviso">{semViuvas('Abrimos o seu app de e-mail com a mensagem pronta. É só tocar em enviar.')}</div>}
        <button className="btn btn-azul btn-grande" disabled={estado === 'enviando' || !mensagem.trim()}><Mensagem size={18} /> {estado === 'enviando' ? 'Enviando…' : 'Enviar ideia'}</button>
      </form>
    </Janela>
  );
}
