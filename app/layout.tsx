import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/lib/auth-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'IA VIRAL - Gerador de Vídeos Virais',
  description: 'Crie vídeos virais com IA: cortes, troca de roupa, troca de rosto e geração de vídeos.',
  openGraph: {
    images: [{ url: 'https://bolt.new/static/og_default.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: [{ url: 'https://bolt.new/static/og_default.png' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              classNames: {
                toast:
                  'group toast group-[.toaster]:bg-zinc-900 group-[.toaster]:text-white group-[.toaster]:border-zinc-800 group-[.toaster]:shadow-lg',
                description: 'group-[.toast]:text-zinc-400',
                actionButton:
                  'group-[.toast]:bg-[#00FF88] group-[.toast]:text-black',
                cancelButton:
                  'group-[.toast]:bg-zinc-800 group-[.toast]:text-zinc-300',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
