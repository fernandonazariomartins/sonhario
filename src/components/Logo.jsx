import { Link } from 'react-router-dom';
import { Marca } from './Icones.jsx';

export default function Logo({ para = '/' }) {
  return (
    <Link to={para} className="marca" aria-label="Sonhário, página inicial">
      <span className="marca-quadrado"><Marca /></span>
      Sonhário
    </Link>
  );
}
