const base = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
const I = ({ d, size = 18, w = 2, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth={w} {...base}>{d ? <path d={d} /> : children}</svg>
);

export const Marca = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="44 40 168 168" aria-hidden="true">
    <path fill="#fff" fillRule="evenodd" d="M149.38 204.75C143.76 204.47 132.14 203.96 115.50 203.25C112.27 203.11 106.93 202.88 103.63 202.74C99.16 202.55 97.54 202.40 97.29 202.15C97.00 201.86 97.02 201.29 97.46 198.46C97.93 195.37 98.24 193.24 99.51 184.25C100.36 178.24 100.98 173.93 101.40 171.12C101.62 169.61 101.96 167.25 102.14 165.88C102.85 160.48 103.26 157.57 103.49 156.38C103.62 155.69 103.79 154.51 103.87 153.75C103.96 152.99 104.24 150.91 104.50 149.12C104.76 147.34 105.21 144.19 105.51 142.12C105.80 140.06 106.24 136.91 106.50 135.12C106.76 133.34 107.21 130.19 107.50 128.12C107.79 126.06 108.19 123.31 108.39 122.00C109.10 117.30 109.11 116.83 108.59 116.55C108.34 116.42 107.51 116.23 106.75 116.13C105.51 115.96 102.00 115.12 98.62 114.18C93.12 112.64 82.64 107.78 77.75 104.50C77.41 104.27 76.62 103.75 76.00 103.35C70.60 99.87 60.25 91.60 60.25 90.77C60.25 90.15 68.23 81.83 72.38 78.12C77.54 73.52 86.17 67.08 90.12 64.90C90.54 64.67 91.66 64.04 92.62 63.48C94.43 62.45 101.10 59.10 102.39 58.58C102.80 58.42 103.80 58.01 104.62 57.67C109.91 55.51 116.63 53.68 122.81 52.70C125.92 52.21 127.32 52.13 133.75 52.13C140.27 52.13 141.53 52.19 144.62 52.70C150.08 53.60 154.31 54.67 159.12 56.39C163.58 57.97 163.82 58.07 168.75 60.48C172.09 62.12 173.35 62.79 175.38 64.03C175.79 64.28 176.52 64.72 177.00 65.00C181.71 67.76 191.75 75.27 192.13 76.32C192.34 76.90 192.09 77.26 189.11 80.75C184.05 86.68 176.10 94.12 169.88 98.77C166.85 101.03 165.94 101.66 161.75 104.38C158.81 106.28 151.42 110.10 147.91 111.52C147.10 111.85 146.38 112.28 146.30 112.47C146.23 112.66 146.37 114.13 146.61 115.72C146.85 117.32 147.26 120.09 147.53 121.88C147.80 123.66 148.19 126.25 148.41 127.62C148.63 129.00 148.95 131.19 149.14 132.50C149.32 133.81 149.59 135.66 149.74 136.62C149.89 137.59 150.24 139.89 150.52 141.75C150.80 143.61 151.25 146.64 151.53 148.50C151.81 150.36 152.25 153.28 152.51 155.00C153.33 160.49 154.01 165.04 154.50 168.25C154.76 169.97 155.20 172.89 155.48 174.75C155.76 176.61 156.11 178.91 156.26 179.88C156.41 180.84 156.68 182.69 156.86 184.00C157.05 185.31 157.37 187.50 157.58 188.88C157.80 190.25 158.21 192.95 158.50 194.88C158.79 196.80 159.25 199.76 159.52 201.45C159.79 203.14 159.95 204.63 159.87 204.76C159.71 205.02 154.89 205.02 149.38 204.75ZM100.40 85.26a27.00 27.00 0 1 0 54.01 0a27.00 27.00 0 1 0 -54.01 0Z" />
  </svg>
);
export const Mic = (p) => <I {...p}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v3" /></I>;
export const Parar = ({ size = 26 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2.5" /></svg>;
export const Play = ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" /></svg>;
export const Pausa = ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>;
export const Mural = (p) => <I {...p}><rect x="3" y="3" width="7" height="9" rx="2" /><rect x="14" y="3" width="7" height="5" rx="2" /><rect x="14" y="12" width="7" height="9" rx="2" /><rect x="3" y="16" width="7" height="5" rx="2" /></I>;
export const Lista = (p) => <I {...p} d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />;
export const Tema = (p) => <I {...p}><path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z" /><circle cx="8" cy="8" r="1.4" /></I>;
export const Titulo = (p) => <I {...p} d="M5 7V5h14v2M12 5v14M9 19h6" />;
export const Busca = (p) => <I {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></I>;
export const Voltar = (p) => <I {...p} d="M15 6l-6 6 6 6" />;
export const Avancar = (p) => <I {...p} d="M9 6l6 6-6 6" />;
export const Mais = (p) => <I {...p} w={2.4} d="M12 5v14M5 12h14" />;
export const Fechar = (p) => <I {...p} w={2.6} d="M6 6l12 12M18 6L6 18" />;
// Estrela: vazada por padrão; "cheia" preenche (sonho favorito).
export const Estrela = ({ size = 18, cheia = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" strokeWidth={2} {...base} fill={cheia ? 'currentColor' : 'none'}><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z" /></svg>
);
export const Ok = (p) => <I {...p} w={2.6} d="M5 12l5 5L20 7" />;
export const Lixo = (p) => <I {...p} d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3" />;
export const Importar = (p) => <I {...p} d="M12 4v11M7 10l5 5 5-5M5 20h14" />;
export const Sair = (p) => <I {...p} d="M15 4h4v16h-4M10 17l5-5-5-5M15 12H3" />;
export const Celular = (p) => <I {...p}><rect x="6" y="2.5" width="12" height="19" rx="3" /><path d="M11 18.5h2" /></I>;
export const Caneta = (p) => <I {...p} d="M4 20h4L19 9l-4-4L4 16z M14 6l4 4" />;
export const Cadeado = (p) => <I {...p}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></I>;
export const Faisca = (p) => <I {...p} d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.5 2.5M15.2 15.2l2.5 2.5M6.3 17.7l2.5-2.5M15.2 8.8l2.5-2.5" />;
export const Sino = (p) => <I {...p}><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></I>;
export const Olho = (p) => <I {...p}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></I>;
export const OlhoFechado = (p) => <I {...p}><path d="M4 4l16 16M10.6 6.1A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.7 3.4M6.3 7.6A16.6 16.6 0 0 0 2.5 12S6 18.5 12 18.5a9 9 0 0 0 4.4-1.1M9.9 9.9a3 3 0 0 0 4.2 4.2" /></I>;
export const Pontos = ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" /></svg>;
export const Mensagem = (p) => <I {...p} d="M4 5h16v11H9l-5 4z" />;
export const Calendario = (p) => <I {...p}><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></I>;
export const Pessoas = (p) => <I {...p}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5" /></I>;
export const Copiar = (p) => <I {...p}><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" /></I>;
export const Compartilhar = (p) => <I {...p}><circle cx="18" cy="5.5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="18.5" r="2.5" /><path d="M8.2 10.8l7.6-4.1M8.2 13.2l7.6 4.1" /></I>;
export const Link = (p) => <I {...p} d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />;
export const Imagem = (p) => <I {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.6" /><path d="M21 16l-5-5-9 9" /></I>;
export const Documento = (p) => <I {...p}><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4" /><path d="M9 17v-3M12 17v-5M15 17v-2" /></I>;
export const Amplificar = (p) => <I {...p}><circle cx="12" cy="12" r="2" /><path d="M8 8a5.7 5.7 0 0 0 0 8M16 8a5.7 5.7 0 0 1 0 8M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14" /></I>;
export const Restaurar = (p) => <I {...p} d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" />;
