import { Link } from 'react-router-dom';
import { Marca } from './Icones.jsx';

// "ficar" mantém quem já está logado na página inicial em vez de mandar direto para o app.
export default function Logo({ para = '/', ficar = false }) {
  return (
    <Link to={para} state={ficar ? { ficar: true } : undefined} className="marca" aria-label="Sonhário, página inicial">
      <span className="marca-quadrado"><Marca /></span>
      Sonhário
    </Link>
  );
}
