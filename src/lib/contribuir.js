import { tr } from './i18n.js';
// "Contribuir com uma ideia": a mensagem vai para o e-mail do Fernando.
// Com VITE_WEB3FORMS_KEY (chave gratuita de web3forms.com ligada ao e-mail), envia direto do app.
// Sem a chave, abre o app de e-mail da pessoa com a mensagem pronta.
export const EMAIL_CONTATO = 'fernandonazariomartins@outlook.com';
const CHAVE = import.meta.env.VITE_WEB3FORMS_KEY;

export async function enviarIdeia({ mensagem, nome, email }) {
  const assunto = tr("Sonhário · uma ideia") + (nome ? tr(' de ') + nome : '');
  if (!CHAVE) {
    const corpo = mensagem + (nome || email ? '\n\n— ' + [nome, email].filter(Boolean).join(' · ') : '');
    window.location.href = 'mailto:' + EMAIL_CONTATO + '?subject=' + encodeURIComponent(assunto) + '&body=' + encodeURIComponent(corpo);
    return 'email';
  }
  const r = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ access_key: CHAVE, subject: assunto, from_name: nome || tr("Sonhário"), ...(email ? { email, replyto: email } : {}), message: mensagem, pagina: location.href }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.success) throw new Error(j.message || tr("falha no envio"));
  return 'enviado';
}
