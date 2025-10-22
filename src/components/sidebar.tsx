
'use client';

import { MessageSquare, LayoutTemplate, Search, CheckSquare, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'ИИ Антон', href: '#', icon: MessageSquare, current: true },
  { name: 'Шаблонайзер', href: '#', icon: LayoutTemplate, current: false },
  { name: 'DeepSearch', href: '#', icon: Search, current: false },
  { name: 'Проверка кейсов', href: '#', icon: CheckSquare, current: false },
  { name: 'Админ панель', href: '#', icon: Shield, current: false },
];

export function Sidebar() {
  return (
    <div className="w-64 flex flex-col bg-gray-900 text-white p-4">
        <div className="flex items-center mb-8">
            {/* You can place a logo here if you have one */}
            <h1 className="text-2xl font-bold">Anton AI</h1>
        </div>
        <nav className="flex-1">
            <ul className="space-y-2">
            {navItems.map((item) => (
                <li key={item.name}>
                <a
                    href={item.href}
                    className={cn(
                    'group flex items-center rounded-md px-3 py-2 text-sm font-medium',
                    item.current
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white',
                    !item.current && 'cursor-not-allowed' // Make it look disabled
                    )}
                    aria-current={item.current ? 'page' : undefined}
                    onClick={(e) => !item.current && e.preventDefault()} // Prevent navigation for disabled items
                >
                    <item.icon className="mr-3 h-6 w-6 flex-shrink-0" />
                    <span>{item.name}</span>
                    {!item.current && (
                        <span className="ml-auto rounded-full bg-gray-700 px-2 py-1 text-xs text-gray-300">
                            SOON
                        </span>
                    )}
                </a>
                </li>
            ))}
            </ul>
        </nav>
    </div>
  );
}
