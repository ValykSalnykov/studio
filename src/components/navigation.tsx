
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import UserAuth from '@/components/user-auth';

// Updated link structure for top navigation
const links = [
  {
    href: '/',
    label: 'Користувач',
  },
  {
    href: '/templator',
    label: 'Шаблонизатор',
  },
  {
    href: '/deep-search',
    label: 'Deep Search',
  },
  {
    href: '/cases/working',
    label: 'Робочі кейси',
  },
  {
    href: '/cases/complex',
    label: 'Складні кейси (скоро)',
    disabled: true,
  },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <header className="bg-[#1A237E] text-white shadow-md">
      <div className="container mx-auto flex items-center justify-between p-4">
        <h1 className="text-xl font-bold">Dao planner</h1>
        <UserAuth />
      </div>
      <div className="bg-[#D28F00]">
        <nav className="container mx-auto flex items-center space-x-6 p-2 text-sm font-medium">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.disabled ? '#' : link.href}
              className={cn(
                'px-3 py-1.5 rounded-md transition-colors',
                {
                  'bg-black/10 text-white': pathname === link.href && !link.disabled,
                  'text-white/80 hover:bg-black/10 hover:text-white': pathname !== link.href && !link.disabled,
                  'text-white/50 cursor-not-allowed': link.disabled,
                }
              )}
              aria-disabled={link.disabled}
              tabIndex={link.disabled ? -1 : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
