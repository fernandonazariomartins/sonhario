// Pergunta, uma vez só: a pessoa só registra os próprios sonhos ou também atende pacientes?
// Quem atende continua com o próprio sonhário; ganha a aba Pacientes e o link de convite.
import Janela from './Janela.jsx';
import { useEstado } from '../lib/estado.jsx';
import { semViuvas } from '../lib/tipografia.js';
import { Mural, Pessoas } from './Icones.jsx';

function Opcao({ icone, titulo, texto, onClick }) {
  return (
    <button type="button" onClick={onClick} className="painel" style={{ padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: 14, textAlign: 'left', cursor: 'pointer', color: 'var(--ink)', width: '100%' }}>
      <span style={{ width: 40, height: 40, borderRadius: 999, background: 'var(--azul-claro)', color: 'var(--azul-escuro)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>{icone}</span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <strong style={{ fontSize: 16 }}>{semViuvas(titulo)}</strong>
        <span style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--muted)' }}>{semViuvas(texto)}</span>
      </span>
    </button>
  );
}

export default function EscolherModo() {
  const { mudarModo } = useEstado();
  return (
    <Janela titulo="Como você vai usar o Sonhário?" aoFechar={() => mudarModo(false)}>
      <Opcao icone={<Mural size={20} />} titulo="Registrar os meus sonhos" texto="Anotar, organizar e voltar aos seus sonhos." onClick={() => mudarModo(false)} />
      <Opcao icone={<Pessoas size={20} />} titulo="Registrar os meus sonhos e atender pacientes" texto="Além do seu sonhário, você ganha a aba Pacientes, com um link de convite. Cada paciente escolhe quais sonhos mostrar." onClick={() => mudarModo(true)} />
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--muted)' }}>{semViuvas('Dá para mudar quando quiser, no menu ⋯.')}</p>
    </Janela>
  );
}
