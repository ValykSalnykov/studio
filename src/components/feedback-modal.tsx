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
  
  interface Case {
    id: string;
    source: string;
  }
  
  interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    message?: string;
    initialCase?: Case;
    onSubmit: (feedback: { cases: Case[]; summary: string }) => void;
  }
  
  export function FeedbackModal({ isOpen, onClose, message, initialCase, onSubmit }: FeedbackModalProps) {
    const [cases, setCases] = useState<Case[]>([]);
    const [summary, setSummary] = useState(message || "");
  
    useEffect(() => {
        if (isOpen) {
            const initialCases = [];
            if (initialCase) {
                initialCases.push(initialCase);
            }

            if (message) {
                setSummary(message);
                const caseRegex = /(?:кейс|case)\s*(\d+)/gi;
                const sourceRegex = /(?:из|from)\s*(telegram|телеграм|slack|слак| почты|email)/gi;
                let match;
                while ((match = caseRegex.exec(message)) !== null) {
                    const caseId = match[1];
                    if (!initialCases.some(c => c.id === caseId)) {
                        let sourceMatch = sourceRegex.exec(message);
                        const source = sourceMatch ? sourceMatch[1] : '';
                        initialCases.push({ id: caseId, source: source });
                    }
                }
            } else {
                setSummary('');
            }
            setCases(initialCases);
        }
    }, [isOpen, message, initialCase]);
  
    const handleAddCase = () => {
      setCases([...cases, { id: "", source: "" }]);
    };
  
    const handleCaseChange = (index: number, field: keyof Case, value: string) => {
      const newCases = [...cases];
      newCases[index][field] = value;
      setCases(newCases);
    };
  
    const handleRemoveCase = (index: number) => {
      const newCases = cases.filter((_, i) => i !== index);
      setCases(newCases);
    };
  
    const handleSubmit = () => {
      onSubmit({ cases, summary });
      onClose();
    };
  
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать отзыв</DialogTitle>
            <DialogDescription>
              Добавьте номера кейсов, их источники и итоговый вывод по проделанной работе.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Кейсы</label>
              {cases.map((caseItem, index) => (
                <div key={index} className="flex items-center space-x-2 mt-2">
                  <Input
                    placeholder="Номер кейса"
                    value={caseItem.id}
                    onChange={(e) => handleCaseChange(index, "id", e.target.value)}
                  />
                  <Input
                    placeholder="Источник (telegram, slack)"
                    value={caseItem.source}
                    onChange={(e) => handleCaseChange(index, "source", e.target.value)}
                  />
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveCase(index)}>
                    &times;
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={handleAddCase} className="mt-2">
                Добавить кейс
              </Button>
            </div>
            <div>
              <label className="text-sm font-medium">Итоговый вывод</label>
              <Textarea
                placeholder="Проверил кейс 123456 из телеграма. Все хорошо, проблема решена."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={onClose}>Отмена</Button>
            <Button onClick={handleSubmit}>Отправить отзыв</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }