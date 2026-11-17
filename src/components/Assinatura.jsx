// Assinatura obrigatória da família de apps (igual ao .credit do Torvilo).
const ico = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };

export default function Assinatura({ compacta = false }) {
  return (
    <div className={'credit' + (compacta ? ' compact' : '')}>
      <span>Um projeto de <a href="https://linktr.ee/leferdinand" target="_blank" rel="noopener noreferrer">Fernando Martins</a></span>
      <span className="socials">
        <a className="social" href="https://instagram.com/bonitacamisafernandinho" target="_blank" rel="noopener noreferrer" aria-label="Instagram (@bonitacamisafernandinho)" title="Instagram (@bonitacamisafernandinho)"><svg {...ico}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" /></svg></a>
        <a className="social" href="https://www.linkedin.com/in/fernandonazariomartins/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" title="LinkedIn"><svg {...ico}><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 10v7" /><path d="M8 7v.01" /><path d="M12 17v-4a2 2 0 0 1 4 0v4" /><path d="M12 10v7" /></svg></a>
        <a className="social" href="https://fernandonazariomartins.substack.com/" target="_blank" rel="noopener noreferrer" aria-label="Substack" title="Substack"><svg {...ico}><path d="M5 4h14" /><path d="M5 8h14" /><path d="M5 12h14v8l-7-4-7 4z" /></svg></a>
        <a className="social" href="mailto:fernandonazariomartins@outlook.com" rel="noopener noreferrer" aria-label="E-mail" title="E-mail"><svg {...ico}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg></a>
      </span>
    </div>
  );
}
