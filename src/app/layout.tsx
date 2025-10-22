import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Sidebar } from '@/components/sidebar';

export const metadata: Metadata = {
  title: 'ИИ Антон',
  description: 'Чат-интерфейс для ИИ Антона.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-gray-900">
        <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 relative flex items-center justify-center p-6 overflow-y-auto">
                {children}
            </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
