// Temas por IA e transcrição no servidor mandam o relato ou o áudio, abertos, para a OpenAI.
// Por isso ficam desligados até a pessoa ligar, neste aparelho.
const CHAVE = 'sonhario:ia';
export const iaLigada = () => { try { return localStorage.getItem(CHAVE) === '1'; } catch { return false; } };
export const ligarIA = (ligar) => { try { if (ligar) localStorage.setItem(CHAVE, '1'); else localStorage.removeItem(CHAVE); } catch { /* sem armazenamento */ } };
