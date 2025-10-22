'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TelegramCheckItem {
  id: number;
  content: string | null;
}

interface ParsedContent {
  theme: string;
  question: string;
  answer: string;
}

// Функция для парсинга контента
function parseContent(content: string | null): ParsedContent {
  if (!content) {
    return { theme: 'Нет данных', question: '', answer: '' };
  }

  const themeMatch = content.match(/Тема:(.*?);/);
  const questionMatch = content.match(/Вопрос:(.*?);/);
  const answerMatch = content.match(/Ответ:(.*)/s); // Используем флаг `s` для многострочного текста

  const theme = themeMatch ? themeMatch[1].trim() : 'Тема не найдена';
  const question = questionMatch ? questionMatch[1].trim() : '';
  const answer = answerMatch ? answerMatch[1].trim() : '';

  if (theme === 'Тема не найдена' && !question && !answer) {
    return { theme: content, question: '', answer: '' };
  }

  return { theme, question, answer };
}

export default function RabochiePage() {
  const [data, setData] = useState<TelegramCheckItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<TelegramCheckItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function getTelegramCheckData() {
      const { data, error } = await supabase.from('telegramcheck').select('id, content');
      if (error) {
        console.error('Error fetching data from Supabase:', error);
        setData([]);
      } else {
        setData(data || []);
      }
    }
    getTelegramCheckData();
  }, []);

  const handleCardClick = (item: TelegramCheckItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const parsedSelectedItem = selectedItem ? parseContent(selectedItem.content) : null;

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-200">Рабочие кейсы</h1>
      {data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((item) => (
            <Card 
              key={item.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow duration-300 bg-gray-800 border-gray-700 text-white"
              onClick={() => handleCardClick(item)}
            >
              <CardHeader>
                <CardTitle className="text-lg">{parseContent(item.content).theme}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-gray-400">Загрузка данных или кейсы не найдены...</p>
      )}

      {selectedItem && parsedSelectedItem && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-xl mb-4">Детали кейса</DialogTitle>
              <DialogDescription asChild>
                 <div className="space-y-4 text-gray-300">
                    <div>
                      <h3 className="font-semibold text-lg text-white">Тема:</h3>
                      <p className="mt-1 text-base">{parsedSelectedItem.theme}</p>
                    </div>
                    {parsedSelectedItem.question && (
                      <div>
                        <h3 className="font-semibold text-lg text-white">Вопрос:</h3>
                        <p className="mt-1 text-base whitespace-pre-wrap">{parsedSelectedItem.question}</p>
                      </div>
                    )}
                    {parsedSelectedItem.answer && (
                      <div>
                        <h3 className="font-semibold text-lg text-white">Ответ:</h3>
                        <p className="mt-1 text-base whitespace-pre-wrap">{parsedSelectedItem.answer}</p>
                      </div>
                    )}
                  </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6">
                 <Button 
                   onClick={() => setIsModalOpen(false)} 
                   variant="outline"
                   className="text-gray-200 border-gray-600 hover:bg-gray-700 hover:text-white"
                 >
                   Закрыть
                 </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
