
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  MessageSquare, 
  Search, 
  CaseSensitive, 
  ChevronDown, 
  ChevronRight,
  LayoutTemplate, // Иконка для Шаблонайзера
  Shield,         // Иконка для Админ панели
} from 'lucide-react';

// Обновленная структура ссылок с неактивными элементами
const links = [
  {
    href: '/',
    label: 'ИИ Антон',
    icon: MessageSquare,
  },
  {
    href: '/templator',
    label: 'Шаблонизатор',
    icon: LayoutTemplate,
  },
  {
    href: '/deep-search',
    label: 'Deep Search',
    icon: Search,
  },
  {
    label: 'Проверка кейсов',
    icon: CaseSensitive,
    subLinks: [
      { href: '/cases/working', label: 'Рабочие' },
      { href: '/cases/complex', label: 'Сложные' },
      { href: '/cases/pending', label: 'Отложенные' },
    ],
  },
  {
    label: 'Админ панель (soon)',
    icon: Shield,
    disabled: true, // Флаг неактивности
  },
];

// Компонент для элемента навигации
function NavLink({ link, pathname }: { link: any; pathname: string }) {
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
  const isParentActive = link.subLinks?.some((sub: any) => pathname.startsWith(sub.href));

  useState(() => {
    if (isParentActive) {
      setIsSubMenuOpen(true);
    }
  });

  // Рендеринг подменю
  if (link.subLinks) {
    return (
      <div>
        <button
          onClick={() => setIsSubMenuOpen(!isSubMenuOpen)}
          className={cn(
            'flex w-full items-center justify-between space-x-3 px-3 py-2 rounded-md text-sm font-medium',
            isParentActive
              ? 'bg-gray-700 text-white'
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          )}
        >
          <div className="flex items-center space-x-3">
            <link.icon className="w-5 h-5" />
            <span>{link.label}</span>
          </div>
          {isSubMenuOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        {isSubMenuOpen && (
          <div className="mt-1 ml-6 flex flex-col space-y-1 border-l border-gray-600 pl-3">
            {link.subLinks.map((subLink: any) => (
              <Link
                key={subLink.href}
                href={subLink.href}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium',
                  pathname === subLink.href
                    ? 'text-white bg-gray-600'
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                )}
              >
                {subLink.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Рендеринг неактивной ссылки
  if (link.disabled) {
    return (
      <div className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-gray-500 cursor-not-allowed">
        <link.icon className="h-5 w-5" />
        <span>{link.label}</span>
      </div>
    );
  }

  // Рендеринг обычной ссылки
  return (
    <Link
      href={link.href}
      className={cn(
        'flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium',
        pathname === link.href
          ? 'bg-gray-700 text-white'
          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
      )}
    >
      <link.icon className="w-5 h-5" />
      <span>{link.label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-gray-800 md:bg-gray-900 md:p-4 text-white">
       <div className="mb-8">
        <h1 className="text-2xl font-bold">Anton AI</h1>
      </div>
      <nav className="flex flex-col space-y-2">
        {links.map((link, index) => (
          <NavLink key={index} link={link} pathname={pathname} />
        ))}
      </nav>
    </aside>
  );
}
