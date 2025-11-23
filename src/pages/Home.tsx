import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Computer,
  FileText,
  Clock,
  Download,
  Library,
  GraduationCap,
  ExternalLink,
} from 'lucide-react';

const MotionLink = motion(Link);

const features = [
  {
    name: 'AI Tools',
    href: '/ai-mentor',
    icon: Computer,
    description: 'Инструменты для работы с AI',
  },
  {
    name: 'Cases',
    href: '/cases/working',
    icon: FileText,
    description: 'Работа с кейсами',
  },
  {
    name: 'Syrve Install',
    href: '/syrve-install',
    icon: Download,
    description: 'Отслеживания установки клиентов Syrve',
  },
  {
    name: 'Time Tracker',
    href: '/time-tracker',
    icon: Clock,
    description: 'Отслеживание и управление временем задач',
  },
  {
    name: 'База знаний',
    href: 'https://kb.daolog.net/',
    icon: Library,
    description: 'Официальная документация и база знаний',
  },
  {
    name: 'Сайт Матрицы',
    href: 'https://matrix.daolog.net/page35616510.html',
    icon: GraduationCap,
    description: 'Платформа для прохождения экзаменов',
  },
];

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem] drop-shadow-lg">
          DAO Hub
        </h1>
        <p className="mt-4 text-xl text-gray-400">
          Ваш центр управления приложениями и инструментами
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature) => {
          const isExternal = feature.href.startsWith('http');
          const linkProps = isExternal 
            ? { as: 'a', href: feature.href, target: '_blank', rel: 'noopener noreferrer' }
            : { to: feature.href };
          
          return (
            <MotionLink
              key={feature.name}
              {...(linkProps as any)}
              className="group relative block p-8 h-48 w-64 overflow-hidden rounded-lg bg-gray-800 shadow-lg border border-gray-700 transition-all duration-100 hover:border-amber-400 hover:shadow-amber-400/20"
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              <div className="flex flex-col justify-between h-full">
                <div>
                  <feature.icon className="h-8 w-8 text-white" />
                  <div className="flex items-center mt-4">
                    <h3 className="text-xl font-bold text-white">{feature.name}</h3>
                    {isExternal && (
                      <ExternalLink className="h-4 w-4 text-gray-400 ml-2" />
                    )}
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-400">{feature.description}</p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-100" />
            </MotionLink>
          );
        })}
      </div>
    </div>
  );
}
