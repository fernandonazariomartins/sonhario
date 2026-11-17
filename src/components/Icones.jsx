const base = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
const I = ({ d, size = 18, w = 2, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth={w} {...base}>{d ? <path d={d} /> : children}</svg>
);

export const Marca = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth="2.4" {...base} stroke="#fff">
    <path d="M3 18h18" /><path d="M7 18a5 5 0 0 1 10 0" /><path d="M12 6v3" /><path d="M5.6 9.6l1.8 1.8" /><path d="M18.4 9.6l-1.8 1.8" />
  </svg>
);
export const Mic = (p) => <I {...p}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v3" /></I>;
export const Parar = ({ size = 26 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2.5" /></svg>;
export const Play = ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" /></svg>;
export const Pausa = ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>;
export const Mural = (p) => <I {...p}><rect x="3" y="3" width="7" height="9" rx="2" /><rect x="14" y="3" width="7" height="5" rx="2" /><rect x="14" y="12" width="7" height="9" rx="2" /><rect x="3" y="16" width="7" height="5" rx="2" /></I>;
export const Lista = (p) => <I {...p} d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />;
export const Tema = (p) => <I {...p}><path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z" /><circle cx="8" cy="8" r="1.4" /></I>;
export const Busca = (p) => <I {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></I>;
export const Voltar = (p) => <I {...p} d="M15 6l-6 6 6 6" />;
export const Avancar = (p) => <I {...p} d="M9 6l6 6-6 6" />;
export const Mais = (p) => <I {...p} w={2.4} d="M12 5v14M5 12h14" />;
export const Fechar = (p) => <I {...p} w={2.6} d="M6 6l12 12M18 6L6 18" />;
export const Ok = (p) => <I {...p} w={2.6} d="M5 12l5 5L20 7" />;
export const Lixo = (p) => <I {...p} d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3" />;
export const Importar = (p) => <I {...p} d="M12 4v11M7 10l5 5 5-5M5 20h14" />;
export const Sair = (p) => <I {...p} d="M15 4h4v16h-4M10 17l5-5-5-5M15 12H3" />;
export const Celular = (p) => <I {...p}><rect x="6" y="2.5" width="12" height="19" rx="3" /><path d="M11 18.5h2" /></I>;
export const Caneta = (p) => <I {...p} d="M4 20h4L19 9l-4-4L4 16z M14 6l4 4" />;
