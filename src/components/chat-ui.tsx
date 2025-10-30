
'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { Send, Bot, User, Loader2, Plus, MessageSquareText, FilePlus2, ThumbsUp, ThumbsDown, Meh } from 'lucide-react';
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
import { onAuthStateChange } from '../lib/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FeedbackModal } from './feedback-modal';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";


interface Case {
    id: string;
    source: string;
}

interface BotResponse {
    case: string;
    output: string;
    source: string;
}

type Message = {
  id: number;
  role: 'user' | 'bot';
  content: any;
  typing?: boolean;
  responseTime?: number;
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
    <Button type="submit" size="icon" disabled={isPending} aria-label="Отправить сообщение" className="bg-indigo-800 hover:bg-indigo-700 text-white">
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
    </Button>
  );
}

function FeedbackIcons({ onOpenFeedback, responseTime }: { onOpenFeedback: () => void, responseTime?: number }) {
    const [feedback, setFeedback] = useState<string | null>(null);

    const handleFeedbackClick = (type: string) => {
        if (type === 'detailed') {
            onOpenFeedback();
            setFeedback('detailed');
        } else {
            setFeedback(type);
        }
    };

    const isButtonDisabled = (type: string) => {
        return feedback !== null && feedback !== type;
    };

    const formatResponseTime = (time?: number) => {
        if (!time) return '';
        const seconds = Math.floor((time / 1000) % 60);
        const minutes = Math.floor((time / (1000 * 60)) % 60);
        if (minutes > 0) {
            return `${minutes}м ${seconds}с`;
        }
        return `${seconds}с`;
    };

    return (
        <TooltipProvider>
            <div className="flex items-center justify-between mt-2 pt-2 border-t">
                <div className="flex items-center gap-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-6 w-6", feedback === 'like' && "text-green-500")}
                                onClick={() => handleFeedbackClick('like')}
                                disabled={isButtonDisabled('like')}
                            >
                                <ThumbsUp className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Помогло</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-6 w-6", feedback === 'ok' && "text-yellow-500")}
                                onClick={() => handleFeedbackClick('ok')}
                                disabled={isButtonDisabled('ok')}
                            >
                                <Meh className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Норм</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-6 w-6", feedback === 'dislike' && "text-red-500")}
                                onClick={() => handleFeedbackClick('dislike')}
                                disabled={isButtonDisabled('dislike')}
                            >
                                <ThumbsDown className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Не помогло</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-6 w-6", feedback === 'detailed' && "text-blue-500")}
                                onClick={() => handleFeedbackClick('detailed')}
                                disabled={isButtonDisabled('detailed')}
                            >
                                <MessageSquareText className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Детальный отзыв</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
                {responseTime && <span className="text-xs text-gray-400">{formatResponseTime(responseTime)}</span>}
            </div>
        </TooltipProvider>
    );
}

function BotMessage({ content, typing, onOpenFeedback, responseTime }: { content: any, typing?: boolean, onOpenFeedback: () => void, responseTime?: number }) {
    if (typing) {
        return <TypingIndicator />;
    }

    let displayContent;
    let logs;
    if (typeof content === 'string') {
        displayContent = content;
    } else if (content && typeof content === 'object') {
        displayContent = content.text || content.output;
        logs = content.logs;
    } else {
        displayContent = JSON.stringify(content);
    }
    
    return (
        <div>
            <div className="text-sm break-words whitespace-pre-wrap">{displayContent}</div>
            {logs && logs.length > 0 && <LogMessage logs={logs} />}
            <FeedbackIcons onOpenFeedback={onOpenFeedback} responseTime={responseTime} />
        </div>
    );
}

export default function ChatUI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isFeedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedMessageForFeedback, setSelectedMessageForFeedback] = useState<string | undefined>(undefined);
  const [initialCase, setInitialCase] = useState<Case | undefined>();

  const [siteEnabled, setSiteEnabled] = useState(true);
  const [bzEnabled, setBzEnabled] = useState(true);
  const [telegramEnabled, setTelegramEnabled] = useState(false);

  const handleNewChat = () => {
    setMessages([]);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setCurrentUser(user);
      if (!user) {
        setMessages([]);
        setFeedbackModalOpen(false);
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

  const handleSend = (feedback?: { case: Case; summary: string }) => {
    if (!currentUser) return;
    const trimmedInput = input.trim();
    if (!trimmedInput && !feedback) return;

    let userMessageContent: string;
    const formData = new FormData();
    formData.append('sessionId', currentUser.uid);
    const startTime = Date.now();

    if (feedback) {
        userMessageContent = `Отзыв: ${feedback.summary}`;
        formData.append('review', 'true');
        formData.append('review_message', feedback.summary);
        formData.append('cases', JSON.stringify([feedback.case]));
    } else {
        userMessageContent = trimmedInput;
        formData.append('message', trimmedInput);
        formData.append('site', String(siteEnabled));
        formData.append('bz', String(bzEnabled));
        formData.append('telegram', String(telegramEnabled));
        formData.append('review', 'false');
    }

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

    startTransition(async () => {
      const result = await sendMessage(null, formData);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      let botContent: any;
      let logs;
      
      if (result?.response) {
        try {
            const parsedResponse = JSON.parse(result.response);
            botContent = parsedResponse[0];
        } catch (e) {
            botContent = { text: result.response, logs: result.logs };
        }
      } else if (result?.error) {
        const errorString = Array.isArray(result.error) ? result.error.join('\n') : result.error;
        botContent = { text: <span className="text-destructive">Ошибка: {errorString}</span>, logs: result.logs };
      } else {
        botContent = <span className="text-destructive">Произошла неизвестная ошибка.</span>;
      }
      
      const botMessage: Message = {
        id: Date.now() + 1,
        role: 'bot',
        content: botContent,
        responseTime,
      };
      
      setMessages(prev => [...prev.filter(m => !m.typing), botMessage]);
    });

    setInput('');
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      handleSend();
  }

  const openFeedbackModal = (message: any) => {
    let initialCase: Case | undefined;

    if (message && typeof message === 'object' && message.case && message.source) {
        initialCase = { id: message.case, source: message.source };
    }
    
    setSelectedMessageForFeedback(undefined);
    setInitialCase(initialCase);
    setFeedbackModalOpen(true);
  }

  return (
    <div className="w-full h-full relative">
        <FeedbackModal 
            isOpen={isFeedbackModalOpen}
            onClose={() => setFeedbackModalOpen(false)}
            message={selectedMessageForFeedback}
            initialCase={initialCase}
            onSubmit={(feedback) => handleSend(feedback)}
        />
        <Card className="w-full h-full flex flex-col shadow-none bg-card rounded-none">
        <CardHeader className="border-b p-2">
          <div className="flex w-full items-center justify-between gap-4">
            <div className="flex-1 flex items-center">
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
            <CardTitle className="font-headline text-2xl text-center flex-1">
              ИИ Ментор
            </CardTitle>
            <div className="flex-1"></div>
          </div>
        </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-2 md:p-4">
                <ScrollArea className="h-full">
                <div className="space-y-4 pr-2">
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
                                'rounded-lg px-4 py-2 shadow-md max-w-full',
                                message.role === 'user'
                                ? 'bg-primary text-primary-foreground rounded-br-none max-w-md lg:max-w-2xl'
                                : 'bg-muted text-card-foreground rounded-bl-none',
                                { 'w-full': message.role === 'bot' && !message.typing }
                            )}
                            >
                                {message.role === 'bot' ? (
                                    <BotMessage 
                                        content={message.content} 
                                        typing={message.typing} 
                                        onOpenFeedback={() => openFeedbackModal(message.content)}
                                        responseTime={message.responseTime}
                                    />
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
            <CardFooter className="border-t py-[5px]">
                <div className="w-full">
                    <div className="flex items-center gap-3 mb-2">
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
                    <form
                    onSubmit={handleSubmit}
                    className="w-full flex items-center gap-3"
                    >
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={!currentUser} className="flex-shrink-0 animate-in fade-in-0 zoom-in-95 duration-300">
                                    <Plus className="h-5 w-5" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent side="top" align="start" className="w-auto p-1">
                                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => openFeedbackModal(undefined)}>
                                    <MessageSquareText className="h-4 w-4 mr-2" />
                                    Создать отзыв
                                </Button>
                            </PopoverContent>
                        </Popover>
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={
                            !currentUser 
                                ? "Пожалуйста, сначала войдите" 
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
