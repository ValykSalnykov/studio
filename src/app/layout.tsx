'use client';

import type { Metadata } from 'next';
import { usePathname } from 'next/navigation';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Navigation } from '@/components/navigation';
import { cn } from '@/lib/utils';

// Since we're using a client-side hook (usePathname), the metadata object is not supported here directly.
// You might need to handle metadata differently, e.g., in a parent server component or using a different approach.

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <html lang="ru">
      <head>
        <title>DAO apps</title>
        <meta name="description" content="Чат-интерфейс для ИИ Антона." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-gray-900 text-white">
        <div className="flex flex-col h-screen">
          <Navigation />
          <main className={cn("flex-1 overflow-y-auto", {
            "p-0": isHomePage, // No padding on the homepage
            "p-6": !isHomePage
          })}>
            {children}
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
