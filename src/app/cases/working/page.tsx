'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface TelegramCheckItem {
  id: number;
  content: string | null;
}

interface ParsedContent {
  theme: string;
  question: string;
  answer: string;
}

function parseContent(content: string | null): ParsedContent {
  if (!content) {
    return { theme: 'Нет данных', question: '', answer: '' };
  }
  const themeMatch = content.match(/Тема:(.*?);/);
  const questionMatch = content.match(/Вопрос:(.*?);/);
  const answerMatch = content.match(/Ответ:(.*)/s);

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
  const [isEditMode, setIsEditMode] = useState(false);

  const [editedTheme, setEditedTheme] = useState('');
  const [editedQuestion, setEditedQuestion] = useState('');
  const [editedAnswer, setEditedAnswer] = useState('');

  const [selectedSources, setSelectedSources] = useState({
    site: false,
    youtube: false,
    telegram: false,
    instagram: false,
  });
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [selectedCaseIds, setSelectedCaseIds] = useState<number[]>([]);

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

  const parsedSelectedItem = useMemo(() => selectedItem ? parseContent(selectedItem.content) : null, [selectedItem]);

  const handleCardClick = (item: TelegramCheckItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
    setIsEditMode(false);
  };

  const handleEditClick = () => {
    if (parsedSelectedItem) {
      setEditedTheme(parsedSelectedItem.theme);
      setEditedQuestion(parsedSelectedItem.question);
      setEditedAnswer(parsedSelectedItem.answer);
      setIsEditMode(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedItem) return;

    const newContent = `Тема: ${editedTheme}; Вопрос: ${editedQuestion}; Ответ: ${editedAnswer}`;
    const { data: updatedData, error } = await supabase
      .from('telegramcheck')
      .update({ content: newContent })
      .eq('id', selectedItem.id)
      .select();

    if (error) {
      console.error('Error updating data:', error);
      // Тут можно показать уведомление об ошибке
    } else if (updatedData) {
      setData(prevData => prevData.map(item => item.id === selectedItem.id ? { ...item, content: newContent } : item));
      setSelectedItem(prevItem => prevItem ? { ...prevItem, content: newContent } : null);
      setIsEditMode(false);
    }
  };
  
  const handleStatusChange = async (status: 'ok' | 'not_ok' | 'pending') => {
    if (!selectedItem) return;

    const { id, content } = selectedItem;
    let targetTable = '';
    if (status === 'not_ok') targetTable = 'complexcheck';
    if (status === 'pending') targetTable = 'pendingcheck';

    // Для "ОК" просто удаляем, для остальных - перемещаем
    if (status !== 'ok') {
        const { error: insertError } = await supabase.from(targetTable).insert([{ content }]);
        if (insertError) {
            console.error(`Error moving item to ${targetTable}:`, insertError);
            return;
        }
    }

    const { error: deleteError } = await supabase.from('telegramcheck').delete().eq('id', id);
    if (deleteError) {
        console.error('Error deleting item:', deleteError);
        // Потенциально, нужно обработать случай, когда запись уже в новой таблице, но не удалилась из старой
    } else {
        setData(prevData => prevData.filter(item => item.id !== id));
        setIsModalOpen(false);
    }
  };

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
        <p className="text-gray-400">Кейсы грузятся, секундочку....</p>
      )}

      {selectedItem && parsedSelectedItem && (
        <Dialog open={isModalOpen} onOpenChange={(isOpen) => {
            if (!isOpen) setIsModalOpen(false);
        }}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-xl mb-4">Детали кейса</DialogTitle>
              <DialogDescription asChild>
                {isEditMode ? (
                  <div className="space-y-4">
                    <div>
                      <label className="font-semibold text-lg text-white">Тема:</label>
                      <Input value={editedTheme} onChange={(e) => setEditedTheme(e.target.value)} className="mt-1 bg-gray-800 border-gray-600" />
                    </div>
                    <div>
                      <label className="font-semibold text-lg text-white">Вопрос:</label>
                      <Textarea value={editedQuestion} onChange={(e) => setEditedQuestion(e.target.value)} className="mt-1 bg-gray-800 border-gray-600" rows={5} />
                    </div>
                    <div>
                      <label className="font-semibold text-lg text-white">Ответ:</label>
                      <Textarea value={editedAnswer} onChange={(e) => setEditedAnswer(e.target.value)} className="mt-1 bg-gray-800 border-gray-600" rows={8} />
                    </div>
                  </div>
                ) : (
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
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6 flex justify-between w-full">
              {isEditMode ? (
                <div className='flex justify-end w-full'>
                  <Button onClick={() => setIsEditMode(false)} variant="outline" className="mr-2 text-gray-200">Отмена</Button>
                  <Button onClick={handleSaveEdit} className='bg-blue-600 hover:bg-blue-700 text-white'>Сохранить</Button>
                </div>
              ) : (
                <div className="flex justify-between w-full items-center">
                    <div>
                        <Button onClick={handleEditClick} variant="secondary">Редактировать</Button>
                    </div>
                    <div className="flex space-x-2">
                        <Button onClick={() => handleStatusChange('ok')} className="bg-green-600 hover:bg-green-700 text-white">ОК</Button>
                        <Button onClick={() => handleStatusChange('not_ok')} className="bg-red-600 hover:bg-red-700 text-white">не ОК</Button>
                        <Button onClick={() => handleStatusChange('pending')} className="bg-yellow-500 hover:bg-yellow-600 text-white">Отложить</Button>
                    </div>
                </div>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
