
'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { Send, Bot, User, Loader2, ChevronDown, ChevronRight, Plus, MessageSquareText, FilePlus2 } from 'lucide-react';
import { sendMessage } from '@/app/actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { onAuthStateChange } from '../lib/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type Message = {
  id: number;
  role: 'user' | 'bot';
  content: React.ReactNode;
  logs?: string[];
  typing?: boolean;
};

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
      <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
      <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" />
    </div>
  );
}

function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <Button type="submit" size="icon" disabled={isPending} aria-label="Отправить сообщение" className="bg-accent hover:bg-accent/90">
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
    </Button>
  );
}

function LogMessage({ logs }: { logs: string[] }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-2">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-1 text-xs">
            {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            Технические детали
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent asChild>
         <pre className="text-xs whitespace-pre-wrap font-mono bg-slate-800 text-white p-4 rounded-md mt-1">
            {logs.join('\n')}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  );
}

function BotMessage({ content, logs, typing }: { content: React.ReactNode, logs?: string[], typing?: boolean }) {
    if (typing) {
        return <TypingIndicator />;
    }
    return (
        <div>
            <div className="text-sm break-words">{content}</div>
            {logs && logs.length > 0 && <LogMessage logs={logs} />}
        </div>
    );
}

export default function ChatUI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isFeedbackMode, setIsFeedbackMode] = useState(false);
  const [siteEnabled, setSiteEnabled] = useState(false);
  const [bzEnabled, setBzEnabled] = useState(false);
  const [telegramEnabled, setTelegramEnabled] = useState(false);

  const handleNewChat = () => {
    setMessages([]);
  };

  const toggleFeedbackMode = () => {
    setIsFeedbackMode(prev => !prev);
    setInput('');
    setCaseNumber('');
  }

  const handleCaseNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const regex = /^[0-9,]*$/;
    if (regex.test(value)) {
        setCaseNumber(value);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setCurrentUser(user);
      if (!user) {
        setMessages([]);
        setIsFeedbackMode(false);
      }
    });
    return () => unsubscribe();
  }, []);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) return;
    const trimmedInput = input.trim();
    if ((!trimmedInput && !caseNumber) || isPending) return;

    const userMessageContent = isFeedbackMode
      ? `Отзыв по кейсу №${caseNumber || 'N/A'}: ${trimmedInput}`
      : trimmedInput;

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: userMessageContent,
    };
    
    const typingMessage: Message = {
        id: Date.now() + 1,
        role: 'bot',
        content: '',
        typing: true,
    }

    setMessages(prev => [...prev, userMessage, typingMessage]);

    const formData = new FormData();
    const webhookMessage = isFeedbackMode ? `Кейс №${caseNumber}: ${trimmedInput}` : trimmedInput;
    formData.append('message', webhookMessage);
    formData.append('sessionId', currentUser.uid);
    if(isFeedbackMode) {
        formData.append('review', 'true');
    }

    startTransition(async () => {
      const result = await sendMessage(null, formData);

      let botContent: React.ReactNode;
      let logs: string[] | undefined;
      
      if (result?.response) {
        botContent = result.response;
        logs = result.logs
      } else if (result?.error) {
        const errorString = Array.isArray(result.error) ? result.error.join('\n') : result.error;
        botContent = <span className="text-destructive">Ошибка: {errorString}</span>;
        logs = result.logs;
      } else {
        botContent = <span className="text-destructive">Произошла неизвестная ошибка.</span>;
      }
      
      const botMessage: Message = {
        id: Date.now() + 1,
        role: 'bot',
        content: botContent,
        logs: logs,
      };
      
      setMessages(prev => [...prev.filter(m => !m.typing), botMessage]);
    });

    setInput('');
    setCaseNumber('');
    if (isFeedbackMode) {
        toggleFeedbackMode();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto relative">
        <Card className="w-full h-[85vh] md:h-[75vh] flex flex-col shadow-2xl bg-card">
        <CardHeader className="border-b p-4">
          <div className="flex w-full items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNewChat}
                disabled={!currentUser || messages.length === 0}
                className="text-muted-foreground"
              >
                <FilePlus2 className="h-4 w-4 mr-2" />
                Новый чат
              </Button>
            </div>
            <CardTitle className="font-headline text-2xl">
              ИИ Антон
            </CardTitle>
          </div>
        </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-6">
                <ScrollArea className="h-full">
                <div className="space-y-6 pr-4">
                    {!currentUser ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <Bot className="h-12 w-12 text-muted-foreground"/>
                            <p className="mt-4 text-lg font-semibold">Пожалуйста, войдите, чтобы начать чат.</p>
                        </div>
                    ) : (
                    <> 
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <Bot className="h-12 w-12 text-muted-foreground"/>
                                <p className="text-sm text-muted-foreground">Отправьте ваше первое сообщение.</p>
                            </div>
                        )}
                        {messages.map((message) => (
                        <div
                            key={message.id}
                            className={cn(
                            'flex items-start gap-3 animate-in fade-in-0 slide-in-from-bottom-4 duration-500',
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                            )}
                        >
                            {message.role === 'bot' && (
                            <Avatar className="h-8 w-8 border">
                                <AvatarFallback className="bg-accent text-accent-foreground">
                                <Bot className="h-5 w-5" />
                                </AvatarFallback>
                            </Avatar>
                            )}
                            <div
                            className={cn(
                                'max-w-md lg:max-w-2xl rounded-lg px-4 py-2 shadow-md',
                                message.role === 'user'
                                ? 'bg-primary text-primary-foreground rounded-br-none'
                                : 'bg-muted text-card-foreground rounded-bl-none'
                            )}
                            >
                                {message.role === 'bot' ? (
                                    <BotMessage content={message.content} logs={message.logs} typing={message.typing} />
                                ) : (
                                    <div className="text-sm break-words">{message.content}</div>
                                )}
                            </div>
                            {message.role === 'user' && (
                            <Avatar className="h-8 w-8 border">
                                <AvatarFallback className="bg-secondary text-secondary-foreground">
                                <User className="h-5 w-5" />
                                </AvatarFallback>
                            </Avatar>
                            )}
                        </div>
                        ))}
                    </>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="border-t pt-4">
                <div className="w-full">
                    {isFeedbackMode && (
                        <div className="space-y-2 mb-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                            <p className="text-xs text-muted-foreground px-2">
                                Предоставь описание выполненных действий по кейсу и полученный результат от выполненных действий.
                            </p>
                            <Input
                                value={caseNumber}
                                onChange={handleCaseNumberChange}
                                placeholder="Введите номер кейса"
                                autoComplete="off"
                                disabled={isPending || !currentUser}
                                className="text-base"
                            />
                        </div>
                    )}
                    {!isFeedbackMode && (
                        <div className="flex items-center gap-3 mb-3">
                             <span className="text-sm font-medium text-muted-foreground">Источник:</span>
                            <Button
                                onClick={() => setSiteEnabled(!siteEnabled)}
                                className={cn(
                                    "h-7 rounded-full px-3 text-xs transition-all duration-200 ease-in-out transform",
                                    siteEnabled
                                        ? "scale-105 bg-green-500 text-white hover:bg-green-600"
                                        : "scale-100 bg-gray-200 text-gray-800 hover:bg-gray-300"
                                )}
                            >
                                Сайт
                            </Button>
                            <Button
                                onClick={() => setBzEnabled(!bzEnabled)}
                                className={cn(
                                    "h-7 rounded-full px-3 text-xs transition-all duration-200 ease-in-out transform",
                                    bzEnabled
                                        ? "scale-105 bg-green-500 text-white hover:bg-green-600"
                                        : "scale-100 bg-gray-200 text-gray-800 hover:bg-gray-300"
                                )}
                            >
                                БЗ
                            </Button>
                            <Button
                                onClick={() => setTelegramEnabled(!telegramEnabled)}
                                className={cn(
                                    "h-7 rounded-full px-3 text-xs transition-all duration-200 ease-in-out transform",
                                    telegramEnabled
                                        ? "scale-105 bg-green-500 text-white hover:bg-green-600"
                                        : "scale-100 bg-gray-200 text-gray-800 hover:bg-gray-300"
                                )}
                            >
                                Телеграм
                            </Button>
                        </div>
                    )}
                    <form
                    onSubmit={handleSubmit}
                    className="w-full flex items-center gap-3"
                    >
                        {isFeedbackMode ? (
                            <Button variant="ghost" size="icon" onClick={toggleFeedbackMode} disabled={!currentUser} className="flex-shrink-0 animate-in fade-in-0 zoom-in-95 duration-300">
                                <MessageSquareText className="h-5 w-5" />
                            </Button>
                        ) : (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" disabled={!currentUser} className="flex-shrink-0 animate-in fade-in-0 zoom-in-95 duration-300">
                                        <Plus className="h-5 w-5" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent side="top" align="start" className="w-auto p-1">
                                    <Button variant="ghost" size="sm" className="w-full justify-start" onClick={toggleFeedbackMode}>
                                        <MessageSquareText className="h-4 w-4 mr-2" />
                                        Отзыв
                                    </Button>
                                </PopoverContent>
                            </Popover>
                        )}
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={
                            !currentUser 
                                ? "Пожалуйста, сначала войдите" 
                                : isFeedbackMode 
                                    ? "Напишите ваш отзыв"
                                    : "Спросите что-нибудь..."
                        }
                        autoComplete="off"
                        disabled={isPending || !currentUser}
                        className="text-base"
                    />
                    <SubmitButton isPending={isPending} />
                    </form>
                </div>
            </CardFooter>
        </Card>
    </div>
  );
}
