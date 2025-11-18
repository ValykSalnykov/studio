
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
  } from "@/components/ui/dialog";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Textarea } from "@/components/ui/textarea";
  import { useState, useEffect } from "react";
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

  interface Case {
    id: string;
    source: string;
  }

  interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    message?: string;
    initialCase?: Case;
    onSubmit: (feedback: { case: Case; summary: string }) => void;
  }

  const sourceOptions = [
    "Наша база знаний",
    "проверенный канал Навчання",
    "непроверенный канал Навчання",
  ];

  export function FeedbackModal({ isOpen, onClose, message, initialCase, onSubmit }: FeedbackModalProps) {
    const [caseItem, setCaseItem] = useState<Case>({ id: "", source: "" });
    const [summary, setSummary] = useState(message || "");

    useEffect(() => {
        if (isOpen) {
            if (initialCase) {
                setCaseItem(initialCase);
            } else {
                setCaseItem({ id: "", source: "" });
            }

            if (message) {
                setSummary("");
                const caseRegex = /(?:кейс|case)\s*(\d+)/gi;
                const match = caseRegex.exec(message);
                if (match) {
                    const caseId = match[1];
                    if (caseItem.id !== caseId) {
                       setCaseItem(prev => ({ ...prev, id: caseId }));
                    }
                }
            } else {
                setSummary('');
            }
        }
    }, [isOpen, message, initialCase]);

    const handleCaseChange = (field: keyof Case, value: string) => {
      setCaseItem(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = () => {
      onSubmit({ case: caseItem, summary });
      onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-gray-900 text-gray-50 border-gray-700">
          <DialogHeader>
            <DialogTitle>Создать отзыв</DialogTitle>
            <DialogDescription className="text-gray-400">
              Добавьте номер кейса, его источник и итоговый вывод по проделанной работе.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Кейс</label>
                <div className="flex items-center space-x-2 mt-2">
                  <Input
                    placeholder="Номер кейса"
                    value={caseItem.id}
                    onChange={(e) => handleCaseChange("id", e.target.value)}
                    className="bg-gray-800 border-gray-600 text-gray-50"
                  />
                  <Select onValueChange={(value) => handleCaseChange("source", value)} defaultValue={caseItem.source}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-gray-50">
                        <SelectValue placeholder="Источник" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 text-gray-50 border-gray-600">
                        {sourceOptions.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
            </div>
            <div>
              <label className="text-sm font-medium">Итоговый вывод</label>
              <Textarea
                placeholder="Проверил кейс 123456 из телеграма. Все хорошо, проблема решена."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="mt-2 bg-gray-800 border-gray-600 text-gray-50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:bg-gray-700">Отмена</Button>
            <Button onClick={handleSubmit} className="bg-indigo-800 hover:bg-indigo-700 text-white">Отправить отзыв</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
