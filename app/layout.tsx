import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WV3 · Plataforma de Controle de Serviço',
  description: 'Gestão operacional, financeira e administrativa da Organização WV3',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
