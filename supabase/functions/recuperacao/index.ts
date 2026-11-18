// Sonhário · código de recuperação da criptografia básica.
// acao "guardar": guarda o código da própria conta, trancado com uma chave do servidor.
// acao "pegar": devolve o código para a própria conta (quem esqueceu a frase-senha).
// acao "apagar": apaga a cópia (quem passa para a criptografia avançada).
// A chave do servidor sai da chave de serviço do projeto: se ela for trocada, os códigos
// guardados deixam de abrir, e quem estiver na básica precisa criar um novo em Configurações.
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const deB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function chaveDoServidor() {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!), 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new TextEncoder().encode('sonhario-recuperacao'), info: new Uint8Array() },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'],
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return json({ erro: 'entre na sua conta' }, 401);
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  let corpo: { acao?: string; codigo?: string } = {};
  try { corpo = await req.json(); } catch { /* sem corpo */ }
  const k = await chaveDoServidor();

  if (corpo.acao === 'guardar') {
    const codigo = String(corpo.codigo || '');
    if (!/^[A-Z0-9-]{20,60}$/.test(codigo)) return json({ erro: 'código inválido' }, 400);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const aad = new TextEncoder().encode(user.id); // o código só abre para a mesma conta
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad }, k, new TextEncoder().encode(codigo)));
    const { error } = await admin.from('recuperacoes').upsert({ user_id: user.id, codigo: b64(iv) + '.' + b64(ct), criado_em: new Date().toISOString() });
    if (error) return json({ erro: error.message }, 500);
    return json({ ok: true });
  }

  if (corpo.acao === 'pegar') {
    const { data, error } = await admin.from('recuperacoes').select('codigo').eq('user_id', user.id).maybeSingle();
    if (error) return json({ erro: error.message }, 500);
    if (!data) return json({ erro: 'sem código guardado' }, 404);
    try {
      const [iv, ct] = data.codigo.split('.');
      const aad = new TextEncoder().encode(user.id);
      const claro = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: deB64(iv), additionalData: aad }, k, deB64(ct));
      return json({ codigo: new TextDecoder().decode(claro) });
    } catch {
      return json({ erro: 'não deu para abrir o código guardado' }, 500);
    }
  }

  if (corpo.acao === 'apagar') {
    const { error } = await admin.from('recuperacoes').delete().eq('user_id', user.id);
    if (error) return json({ erro: error.message }, 500);
    return json({ ok: true });
  }

  return json({ erro: 'ação desconhecida' }, 400);
});
