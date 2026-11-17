// Sonhário · lembrete da manhã. Chamada a cada 5 minutos pelo pg_cron.
// Envia "Sonhou? Registre." para cada aparelho que chegou na hora de acordar (uma vez por dia).
// Segredos: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, LEMBRETE_SEGREDO.
import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2';

const JANELA_MIN = 30; // se o cron atrasar, ainda envia até 30 min depois da hora

function agoraNoFuso(fuso: string) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: fuso, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { dia: `${p.year}-${p.month}-${p.day}`, minutos: Number(p.hour) * 60 + Number(p.minute) };
}

Deno.serve(async (req) => {
  if (req.headers.get('x-segredo') !== Deno.env.get('LEMBRETE_SEGREDO')) return new Response('não', { status: 401 });

  webpush.setVapidDetails('mailto:fernandonazariomartins@outlook.com', Deno.env.get('VAPID_PUBLIC_KEY')!, Deno.env.get('VAPID_PRIVATE_KEY')!);
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: lista, error } = await sb.from('lembretes').select('*').eq('ativo', true);
  if (error) return new Response(error.message, { status: 500 });

  const aviso = JSON.stringify({ title: 'Sonhou? Registre.', body: 'Toque e fale antes que a imagem vá embora.', url: '/app' });
  let enviados = 0;
  for (const l of lista ?? []) {
    let local;
    try { local = agoraNoFuso(l.fuso); } catch { local = agoraNoFuso('America/Sao_Paulo'); }
    const [h, m] = String(l.hora).split(':').map(Number);
    const alvo = h * 60 + m;
    if (l.ultimo_envio === local.dia || local.minutos < alvo || local.minutos >= alvo + JANELA_MIN) continue;
    try {
      await webpush.sendNotification(l.assinatura, aviso, { TTL: 60 * 60, urgency: 'high' });
      await sb.from('lembretes').update({ ultimo_envio: local.dia }).eq('endpoint', l.endpoint);
      enviados++;
    } catch (e) {
      // Aparelho desinstalou ou revogou a permissão: tira da lista.
      if (e?.statusCode === 404 || e?.statusCode === 410) await sb.from('lembretes').delete().eq('endpoint', l.endpoint);
    }
  }
  return new Response(JSON.stringify({ enviados }), { headers: { 'Content-Type': 'application/json' } });
});
