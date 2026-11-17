// Sonhário · transcreve o áudio de um sonho depois de gravado.
// Usada quando o navegador não transcreve ao vivo (ex.: Safari no iPhone).
// Segredo necessário: OPENAI_API_KEY.
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  // Só quem está logado no Sonhário pode transcrever.
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return json({ erro: 'entre na sua conta' }, 401);

  const form = await req.formData();
  const audio = form.get('audio');
  if (!(audio instanceof File)) return json({ erro: 'sem áudio' }, 400);
  if (audio.size > 25 * 1024 * 1024) return json({ erro: 'áudio grande demais (máx. 25 MB)' }, 413);

  const envio = new FormData();
  envio.append('file', audio, audio.name || 'sonho.webm');
  envio.append('model', 'gpt-4o-mini-transcribe');
  envio.append('language', 'pt');
  envio.append('prompt', 'Relato de um sonho, contado em português por alguém que acabou de acordar.');

  const r = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + Deno.env.get('OPENAI_API_KEY') },
    body: envio,
  });
  if (!r.ok) return json({ erro: 'falha na transcrição', detalhe: await r.text() }, 502);
  const { text } = await r.json();
  return json({ texto: (text ?? '').trim() });
});
