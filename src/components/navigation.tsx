
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import UserAuth from '@/components/user-auth';
import { Download } from 'lucide-react';

// Defines the entire navigation structure
const navigationConfig: Record<string, { href?: string; icon?: React.ElementType; subLinks: any[] }> = {
  'ИИ': {
    subLinks: [
      { href: '/', label: 'Користувач' },
      { href: '/templator', label: 'Шаблонизатор' },
      { href: '/deep-search', label: 'Deep Search' },
      { href: '/cases/working', label: 'Робочі кейси' },
      { href: '/cases/complex', label: 'Складні кейси (скоро)', disabled: true },
    ]
  },
  // 'Syrve Install' is a main link but has no sub-menu
  'Syrve Install': {
    href: '#', // The actual link for Syrve Install
    icon: Download,
    subLinks: [] 
  }
};

export function Navigation() {
  const pathname = usePathname();

  // Determine the initial active main link by checking if the current path matches any sub-link
  const getInitialMainLink = () => {
    for (const mainLabel in navigationConfig) {
      if (navigationConfig[mainLabel].subLinks.some(sub => !sub.disabled && sub.href === pathname)) {
        return mainLabel;
      }
    }
    return 'ИИ'; // Default to 'ИИ' if no match is found
  };
  
  const [activeMainLink, setActiveMainLink] = useState('ИИ');

  // Effect to set the active main link on path change
  useEffect(() => {
    setActiveMainLink(getInitialMainLink());
  }, [pathname]);

  const mainLinks = Object.keys(navigationConfig);
  const currentSubLinks = navigationConfig[activeMainLink]?.subLinks || [];

  return (
    <header className="bg-[#1A237E] text-white shadow-md">
      {/* Top (blue) bar */}
      <div className="container mx-auto flex items-center justify-between p-4">
        {/* Left Section */}
        <div className="w-1/3">
           <h1 className="text-xl font-bold">Dao planner</h1>
        </div>

        {/* Centered Main Navigation */}
        <div className="w-1/3 flex justify-center items-center space-x-8">
          {mainLinks.map((label) => {
            const linkConfig = navigationConfig[label];
            // If the link has sub-links, it's a button to change state.
            // Otherwise, it's a direct link.
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
        
        {/* Right-aligned User Auth */}
        <div className="w-1/3 flex justify-end">
            <UserAuth />
        </div>
      </div>

      {/* Bottom (orange) bar - Conditionally rendered Sub-navigation */}
      {currentSubLinks.length > 0 && (
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
