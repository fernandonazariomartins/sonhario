import { Link } from 'react-router-dom';
import { Marca } from './Icones.jsx';
import { tr } from '../lib/i18n.js';

// "ficar" mantém quem já está logado na página inicial em vez de mandar direto para o app.
export default function Logo({ para = '/', ficar = false }) {
  return (
    <Link to={para} state={ficar ? { ficar: true } : undefined} className="marca" aria-label={tr("Sonhário, página inicial")}>
      <span className="marca-quadrado"><Marca /></span>
      {tr("Sonhário")}
    </Link>
  );
}
