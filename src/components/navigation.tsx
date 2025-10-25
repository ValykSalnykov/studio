'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import UserAuth from '@/components/user-auth';
import { Download, Bot, FolderKanban, Clock } from 'lucide-react';

// Defines the entire navigation structure
const navigationConfig: Record<string, { href?: string; icon?: React.ElementType; subLinks: any[] }> = {
  'AI Tools': {
    icon: Bot,
    subLinks: [
      { href: '/ai-mentor', label: 'ИИ Ментор' },
      { href: '/templator', label: 'Шаблонизатор' },
      { href: '/deep-search', label: 'Deep Search' },
    ]
  },
  'Cases': {
    icon: FolderKanban,
    subLinks: [
        { href: '/cases/working', label: 'Робочі кейси' },
        { href: '/cases/complex', label: 'Складні кейси'},
        { href: '/cases/pending', label: 'Отложенные'},
      ]
  },
  'Syrve Install': {
    href: '/syrve-install',
    icon: Download,
    subLinks: [] 
  },
  'Time Tracker': {
    href: '/time-tracker',
    icon: Clock,
    subLinks: []
  }
};

export function Navigation() {
  const pathname = usePathname();

  const getInitialMainLink = () => {
    if (pathname.startsWith('/cases')) return 'Cases';
    if (pathname === '/syrve-install') return 'Syrve Install';
    if (pathname === '/time-tracker') return 'Time Tracker';
    // Default to 'AI Tools' for any other relevant path
    if (['/', '/ai-mentor', '/templator', '/deep-search'].includes(pathname)) {
      return 'AI Tools';
    }
    return 'AI Tools'; // Fallback
  };
  
  const [activeMainLink, setActiveMainLink] = useState(getInitialMainLink);

  useEffect(() => {
    setActiveMainLink(getInitialMainLink());
  }, [pathname]);

  const mainLinks = Object.keys(navigationConfig);
  const currentSubLinks = navigationConfig[activeMainLink]?.subLinks || [];
  const isHomePage = pathname === '/';

  return (
    <header className="bg-[#1A237E] text-white shadow-md">
      <div className="container mx-auto flex items-center justify-between p-4">
        <div className="w-1/3">
           <Link href="/" className="text-xl font-bold">DAO apps</Link>
        </div>

        {!isHomePage && (
          <div className="w-1/3 flex justify-center items-center space-x-8">
            {mainLinks.map((label) => {
              const linkConfig = navigationConfig[label];
              if (linkConfig.subLinks.length > 0) {
                return (
                  <button
                    key={label}
                    onClick={() => setActiveMainLink(label)}
                    className={cn(
                      'flex items-center space-x-1.5 text-sm font-medium',
                      activeMainLink === label ? 'text-amber-400' : 'hover:text-gray-200'
                    )}
                  >
                    {linkConfig.icon && <linkConfig.icon size={16} />}
                    <span>{label}</span>
                  </button>
                );
              } else {
                return (
                   <Link
                      key={label}
                      href={linkConfig.href || '#'}
                      onClick={() => setActiveMainLink(label)}
                      className={cn(
                          'flex items-center space-x-1.5 text-sm font-medium',
                          activeMainLink === label ? 'text-amber-400' : 'hover:text-gray-200'
                      )}
                   >
                      {linkConfig.icon && <linkConfig.icon size={16} />}
                      <span>{label}</span>
                  </Link>
                )
              }
            })}
          </div>
        )}
        
        <div className="w-1/3 flex justify-end">
            <UserAuth />
        </div>
      </div>

      {!isHomePage && currentSubLinks.length > 0 && (
        <div className="bg-[#D28F00]">
          <nav className="container mx-auto flex items-center justify-center space-x-6 p-2 text-sm font-medium">
            {currentSubLinks.map((link) => (
              <Link
                key={link.href}
                href={link.disabled ? '#' : link.href}
                className={cn(
                  'px-3 py-1.5 rounded-md transition-colors',
                  {
                    'bg-black/20 text-white font-semibold': pathname === link.href && !link.disabled,
                    'text-white/90 hover:bg-black/10 hover:text-white': pathname !== link.href && !link.disabled,
                    'text-white/60 cursor-not-allowed': link.disabled,
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
      )}
    </header>
  );
}
