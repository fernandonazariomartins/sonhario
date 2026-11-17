// Sonhário · sugere temas para um sonho a partir do relato.
// Só nomeia imagens, pessoas, lugares, ações e sentimentos que estão no relato: não interpreta.
// Segredo necessário: OPENAI_API_KEY (o mesmo da função "transcrever").
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const INSTRUCOES = `Você ajuda a etiquetar relatos de sonhos num caderno pessoal.
Leia o relato e proponha até 5 temas curtos (1 ou 2 palavras, em português, minúsculas, no singular).
Os temas nomeiam o que está no sonho: imagens, figuras, pessoas (pelo papel: mãe, chefe, ex), lugares, ações e sentimentos.
Nunca interprete, nunca diga o que algo significa, nunca use termos de análise (arquétipo, sombra, anima etc.) se não estiverem no relato.
Prefira o que é marcante ou se repete no sonho. Não repita temas da lista "evitar".
Responda só com JSON: {"temas": ["...", "..."]}`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  // Só quem está logado no Sonhário pode pedir sugestões.
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return json({ erro: 'entre na sua conta' }, 401);

  const { texto, evitar } = await req.json().catch(() => ({}));
  const relato = String(texto ?? '').trim().slice(0, 6000);
  if (!relato) return json({ temas: [] });
  const lista = Array.isArray(evitar) ? evitar.slice(0, 60).map(String) : [];

  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + Deno.env.get('OPENAI_API_KEY'), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: INSTRUCOES },
        { role: 'user', content: 'Evitar: ' + (lista.join(', ') || 'nada') + '\n\nRelato:\n' + relato },
      ],
    }),
  });
  if (!r.ok) return json({ erro: 'falha ao sugerir', detalhe: await r.text() }, 502);
  try {
    const conteudo = JSON.parse((await r.json()).choices[0].message.content);
    const temas = (Array.isArray(conteudo.temas) ? conteudo.temas : [])
      .map((t: unknown) => String(t).trim().toLowerCase()).filter((t: string) => t && t.length <= 30).slice(0, 5);
    return json({ temas });
  } catch { return json({ temas: [] }); }
});
