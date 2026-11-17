// Gravador de voz + transcrição ao vivo (Web Speech API, quando o navegador oferece).
export function suportaGravacao() {
  return !!(navigator.mediaDevices && window.MediaRecorder);
}

export function suportaTranscricao() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function melhorFormato() {
  const tipos = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
  return tipos.find((t) => window.MediaRecorder?.isTypeSupported?.(t)) || '';
}

export async function iniciarGravacao({ aoTranscrever, aoNivel }) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const tipo = melhorFormato();
  const rec = new MediaRecorder(stream, tipo ? { mimeType: tipo } : undefined);
  const pedacos = [];
  rec.ondataavailable = (e) => e.data.size && pedacos.push(e.data);
  rec.start(500);
  const inicio = Date.now();

  // Nível do microfone para a ondinha na tela.
  let ctx, raf;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const an = ctx.createAnalyser();
    an.fftSize = 256;
    ctx.createMediaStreamSource(stream).connect(an);
    const buf = new Uint8Array(an.frequencyBinCount);
    const passo = () => {
      an.getByteTimeDomainData(buf);
      let pico = 0;
      for (const v of buf) pico = Math.max(pico, Math.abs(v - 128));
      aoNivel?.(Math.min(1, pico / 64));
      raf = requestAnimationFrame(passo);
    };
    passo();
  } catch { /* sem ondinha, tudo bem */ }

  // Transcrição em português, enquanto a pessoa fala.
  let reconhecedor = null;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR && aoTranscrever) {
    reconhecedor = new SR();
    reconhecedor.lang = 'pt-BR';
    reconhecedor.continuous = true;
    reconhecedor.interimResults = true;
    let finais = '';
    reconhecedor.onresult = (e) => {
      let parcial = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finais += r[0].transcript.trim() + ' ';
        else parcial += r[0].transcript;
      }
      aoTranscrever(finais.trim(), parcial.trim());
    };
    reconhecedor.onend = () => { if (rec.state === 'recording') try { reconhecedor.start(); } catch { /* já parou */ } };
    try { reconhecedor.start(); } catch { reconhecedor = null; }
  }

  return {
    parar: () => new Promise((ok) => {
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        cancelAnimationFrame(raf);
        ctx?.close?.();
        ok({ blob: new Blob(pedacos, { type: rec.mimeType || tipo || 'audio/webm' }), duracao: (Date.now() - inicio) / 1000 });
      };
      try { reconhecedor?.stop(); } catch { /* ok */ }
      rec.stop();
    }),
    inicio,
  };
}
