'use client';

let cache: { normal: string; alerta: string } | null = null;
let carregando: Promise<{ normal: string; alerta: string }> | null = null;

// Gera duas versões do favicon a partir da logo: uma normal e outra com um
// badge vermelho no canto (usada para piscar quando há alerta pendente).
export async function obterFavicons(): Promise<{ normal: string; alerta: string }> {
  if (cache) return cache;
  if (carregando) return carregando;

  carregando = new Promise((resolve, reject) => {
    const tamanho = 64;
    const img = new Image();
    img.src = '/logo-wv3.png';
    img.onload = () => {
      const canvasNormal = document.createElement('canvas');
      canvasNormal.width = tamanho;
      canvasNormal.height = tamanho;
      const ctxNormal = canvasNormal.getContext('2d');

      const canvasAlerta = document.createElement('canvas');
      canvasAlerta.width = tamanho;
      canvasAlerta.height = tamanho;
      const ctxAlerta = canvasAlerta.getContext('2d');

      if (!ctxNormal || !ctxAlerta) {
        reject(new Error('Canvas indisponível'));
        return;
      }

      ctxNormal.drawImage(img, 0, 0, tamanho, tamanho);

      ctxAlerta.drawImage(img, 0, 0, tamanho, tamanho);
      ctxAlerta.beginPath();
      ctxAlerta.arc(tamanho - 15, 15, 14, 0, Math.PI * 2);
      ctxAlerta.fillStyle = '#ef4444';
      ctxAlerta.fill();
      ctxAlerta.lineWidth = 3;
      ctxAlerta.strokeStyle = '#0a0a0a';
      ctxAlerta.stroke();

      const resultado = {
        normal: canvasNormal.toDataURL('image/png'),
        alerta: canvasAlerta.toDataURL('image/png'),
      };
      cache = resultado;
      resolve(resultado);
    };
    img.onerror = () => reject(new Error('Não foi possível carregar a logo'));
  });

  return carregando;
}

export function definirFavicon(href: string) {
  if (typeof document === 'undefined') return;
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = href;
}
