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
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";

interface CaseItem {
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

export default function PendingCasesPage() {
  const [data, setData] = useState<CaseItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<CaseItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const [editedTheme, setEditedTheme] = useState('');
  const [editedQuestion, setEditedQuestion] = useState('');
  const [editedAnswer, setEditedAnswer] = useState('');
  const { toast } = useToast();

  const [caseAnalysis, setCaseAnalysis] = useState({
    case_source: 'Telegram',
    case_number: 'TG-12345',
    initial_user_request: 'Пользователь не может найти кнопку для скачивания отчета.',
    user_conclusions: 'Пользователь считает, что интерфейс неудобный и кнопка должна быть более заметной.',
  });

  useEffect(() => {
    async function getPendingCasesData() {
      const { data, error } = await supabase.from('deferredcases').select('id, content');
      if (error) {
        console.error('Error fetching data from Supabase:', error);
        toast({ variant: "destructive", title: "Ошибка", description: "Не удалось загрузить отложенные кейсы." });
        setData([]);
      } else {
        setData(data || []);
      }
    }
    getPendingCasesData();
  }, [toast]);

  const parsedSelectedItem = useMemo(() => selectedItem ? parseContent(selectedItem.content) : null, [selectedItem]);

  const handleCardClick = (item: CaseItem) => {
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
      .from('deferredcases')
      .update({ content: newContent })
      .eq('id', selectedItem.id)
      .select();

    if (error) {
      console.error('Error updating data:', error);
      toast({ variant: "destructive", title: "Ошибка", description: "Не удалось сохранить изменения." });
    } else if (updatedData) {
      setData(prevData => prevData.map(item => item.id === selectedItem.id ? { ...item, content: newContent } : item));
      setSelectedItem(prevItem => prevItem ? { ...prevItem, content: newContent } : null);
      setIsEditMode(false);
      toast({ title: "Успех", description: "Кейс успешно обновлен." });
    }
  };
  
  const handleStatusChange = (status: 'ok' | 'not_ok' | 'pending' | 'think') => {
    if (!selectedItem) return;
    setIsModalOpen(false);
    toast({
        title: "Действие в разработке",
        description: `Действие "${status}" для отложенных кейсов еще не реализовано.`,
    });
  };

  return (
    <div className="p-4 md:p-8">
      <Toaster />
      <h1 className="text-3xl font-bold mb-6 text-black-400 text-center">Отложенные</h1>
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
        <p className="text-gray-400 text-center">Кейсы грузятся, секундочку....</p>
      )}

      {selectedItem && parsedSelectedItem && (
        <Dialog open={isModalOpen} onOpenChange={(isOpen) => {
            if (!isOpen) setIsModalOpen(false);
        }}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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

            <div className="mt-4 border-t border-gray-700 pt-4">
                <Accordion type="single" collapsible>
                    <AccordionItem value="item-1">
                        <AccordionTrigger className='text-lg'>Пост-анализ для эксперта</AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-6 text-gray-300 pt-4">
                                {/* CASE_ANALYSIS */}
                                <div className="space-y-4 p-4 border border-gray-700 rounded-lg bg-gray-800/50">
                                    <h4 className="font-semibold text-lg text-white">Анализ кейса</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="case_source">Источник</Label>
                                            <Input id="case_source" value={caseAnalysis.case_source} onChange={e => setCaseAnalysis({...caseAnalysis, case_source: e.target.value})} className="mt-1 bg-gray-700 border-gray-600" />
                                        </div>
                                        <div>
                                            <Label htmlFor="case_number">Номер кейса</Label>
                                            <Input id="case_number" value={caseAnalysis.case_number} onChange={e => setCaseAnalysis({...caseAnalysis, case_number: e.target.value})} className="mt-1 bg-gray-700 border-gray-600" />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="initial_user_request">Изначальный запрос пользователя</Label>
                                        <Textarea id="initial_user_request" value={caseAnalysis.initial_user_request} onChange={e => setCaseAnalysis({...caseAnalysis, initial_user_request: e.target.value})} className="mt-1 bg-gray-700 border-gray-600" />
                                    </div>
                                    <div>
                                        <Label htmlFor="user_conclusions">Выводы пользователя</Label>
                                        <Textarea id="user_conclusions" value={caseAnalysis.user_conclusions} onChange={e => setCaseAnalysis({...caseAnalysis, user_conclusions: e.target.value})} className="mt-1 bg-gray-700 border-gray-600" />
                                    </div>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>

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
                        <Button onClick={() => handleStatusChange('think')} className="bg-blue-500 hover:bg-blue-600 text-white">Подумать</Button>
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
