// Lembrete da manhã ("Sonhou? Registre."), por notificação push.
// O aparelho se inscreve no push e a assinatura vai para a tabela "lembretes" do Supabase.
// A função "lembrete-manha" roda a cada 5 minutos e avisa quem chegou na hora de acordar.
import { supabase } from './supabase.js';
import { DEMO } from './demo.js';
import { tr } from './i18n.js';

const VAPID = import.meta.env.VITE_VAPID_PUBLIC_KEY;
const CHAVE = 'sonhario:lembrete';

export const lembreteDisponivel = () =>
  !DEMO && !!supabase && !!VAPID && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

export const ehIphone = () => /iPhone|iPad|iPod/.test(navigator.userAgent);
export const instalado = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;

export function lembreteSalvo() {
  try { return JSON.parse(localStorage.getItem(CHAVE)) || { ativo: false, hora: '06:30' }; } catch { return { ativo: false, hora: '06:30' }; }
}

function chaveBytes(b64) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const bin = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export async function ativarLembrete(hora) {
  const permissao = await Notification.requestPermission();
  if (permissao !== 'granted') throw new Error(tr("Sem permissão para notificações. Libere nas configurações do navegador."));
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chaveBytes(VAPID) });
  const fuso = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
  const { error } = await supabase.from('lembretes').upsert({ endpoint: sub.endpoint, assinatura: sub.toJSON(), hora, fuso, ativo: true });
  if (error) throw error;
  localStorage.setItem(CHAVE, JSON.stringify({ ativo: true, hora }));
}

export async function desativarLembrete() {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    await supabase.from('lembretes').delete().eq('endpoint', sub.endpoint);
    await sub.unsubscribe().catch(() => {});
  }
  localStorage.setItem(CHAVE, JSON.stringify({ ...lembreteSalvo(), ativo: false }));
}
