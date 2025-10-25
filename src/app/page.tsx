"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Computer,
  FileText,
  Clock,
  Download,
} from "lucide-react";

const MotionLink = motion(Link);

const features = [
  {
    name: "AI Tools",
    href: "/deep-search",
    icon: Computer,
    description: "Инструменты для работы с AI",
  },
  {
    name: "Cases",
    href: "/cases/pending",
    icon: FileText,
    description: "Просмотр и управление задачами",
  },
  {
    name: "Syrve Install",
    href: "/syrve-install",
    icon: Download,
    description: "Установка и настройка Syrve",
  },
  {
    name: "Time Tracker",
    href: "/time-tracker",
    icon: Clock,
    description: "Отслеживание и управление временем",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem] drop-shadow-lg">
          DAO Apps
        </h1>
        <p className="mt-4 text-xl text-gray-400">
          Ваш центр управления задачами и инструментами
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feature) => (
          <MotionLink
            key={feature.name}
            href={feature.href}
            className="group relative block p-8 h-48 w-64 overflow-hidden rounded-lg bg-gray-800 shadow-lg"
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <div className="flex flex-col justify-between h-full">
              <div>
                <feature.icon className="h-8 w-8 text-white" />
                <h3 className="mt-4 text-xl font-bold text-white">{feature.name}</h3>
              </div>
              <p className="mt-2 text-sm text-gray-400">{feature.description}</p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </MotionLink>
        ))}
      </div>
    </div>
  );
}
