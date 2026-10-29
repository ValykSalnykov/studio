
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Plus, MessageSquareText, FilePlus2, ThumbsUp, ThumbsDown, Meh } from 'lucide-react';
import { sendMessage } from '@/services/api';
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
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import React from 'react';

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

const DISLIKE_REASONS = [
    { code: 'outdated', label: 'Устарело / инфа не актуальна' },
    { code: 'broken', label: 'Не работает по инструкции' },
    { code: 'incorrect', label: 'Неверное / содержит ошибки' },
    { code: 'unclear', label: 'Непонятно объяснено' },
    { code: 'duplicate', label: 'Повторяет другой ответ' },
    { code: 'missing', label: 'Не хватает нужных деталей' },
];

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

async function getSupabaseUserId(firebaseUid: string): Promise<string | null> {
    const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('raw_user_meta_data->>sub', firebaseUid)
        .single();
    
    if (error || !data) {
        console.error('Error fetching supabase user id:', error);
        return null;
    }
    return data.id;
}


function FeedbackIcons({ onOpenFeedback, responseTime, content, currentUser }: { onOpenFeedback: () => void, responseTime?: number, content: any, currentUser: FirebaseUser | null }) {
    const { toast } = useToast();
    const [voteSent, setVoteSent] = useState<number | null>(null);
    const [isDislikePopoverOpen, setDislikePopoverOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);


    const handleVote = async (vote: number, reasonCode?: string, reasonLabel?: string) => {
        if (voteSent !== null) {
            return;
        }

        if (!content || !content.source || !content.case) {
            toast({
                title: 'Ошибка',
                description: 'Недостаточно данных для отправки отзыва.',
                variant: 'destructive',
            });
            return;
        }
        
        if (!currentUser) {
            toast({
                title: 'Ошибка',
                description: 'Необходимо авторизоваться.',
                variant: 'destructive',
            });
            return;
        }
        
        setIsSubmitting(true);
        
        const supabaseUserId = '555e4567-e89b-12d3-a456-426614174022'; // TEST

        if (!supabaseUserId) {
            toast({
                title: 'Ошибка',
                description: 'Не удалось получить идентификатор пользователя для отправки отзыва.',
                variant: 'destructive',
            });
            setIsSubmitting(false);
            setDislikePopoverOpen(false);
            return;
        }

        const tableMap: Record<string, string> = {
            site: 'site',
            bz: 'knowledge',
            telegram: 'telegram',
            telegrambad: 'telegrambad',
        };
        const tableName = tableMap[(content.source || '').toLowerCase()];
        if (!tableName) {
            toast({
                title: 'Ошибка',
                description: 'Неизвестный источник для отзыва.',
                variant: 'destructive',
            });
            setIsSubmitting(false);
            setDislikePopoverOpen(false);
            return;
        }

        const payload: any = {
            target_table: tableName,
            target_id: content.case,
            user_id: supabaseUserId,
            vote: vote,
        };
        
        if (reasonCode && reasonLabel) {
            payload.reason_code = reasonCode;
            payload.reason_label = reasonLabel;
        }

        console.debug("Отправка отзыва:", {
            code: reasonCode,
            case: content.case,
            source: tableName,
        });
        
        const { error } = await supabase.from('feedback_votes').insert(payload);

        setIsSubmitting(false);

        if (error) {
            toast({
                title: 'Ошибка',
                description: `Не удалось отправить отзыв: ${error.message}`,
                variant: 'destructive',
            });
            setVoteSent(null);
        } else {
            setVoteSent(vote);
            if (vote === -1) {
                 toast({
                    title: 'Спасибо за ваш отзыв!',
                    description: `Отзыв сохранён: ${reasonLabel}`,
                });
            } else {
                 toast({
                    title: 'Спасибо за ваш отзыв!',
                    description: 'Ваш голос учтён.',
                });
            }
        }
        setDislikePopoverOpen(false);
    };

    const handleDislikeReasonClick = (reason: { code: string; label: string }) => {
        if (isSubmitting) return;
        handleVote(-1, reason.code, reason.label);
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
             {isDislikePopoverOpen && <div className="fixed inset-0 z-40" />}
            <div className="flex items-center justify-between mt-2 pt-2 border-t">
                <div className="flex items-center gap-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-6 w-6", voteSent === 1 && "text-green-500")}
                                onClick={() => handleVote(1)}
                                disabled={voteSent !== null || isSubmitting}
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
                                className={cn("h-6 w-6", voteSent === -0.5 && "text-yellow-500")}
                                onClick={() => handleVote(-0.5)}
                                disabled={voteSent !== null || isSubmitting}
                            >
                                <Meh className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Норм</p>
                        </TooltipContent>
                    </Tooltip>
                    <Popover open={isDislikePopoverOpen} onOpenChange={setDislikePopoverOpen}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn("h-6 w-6", voteSent === -1 && "text-red-500")}
                                        disabled={voteSent !== null || isSubmitting}
                                        aria-busy={isSubmitting}
                                    >
                                        <ThumbsDown className="h-4 w-4" />
                                    </Button>
                                </PopoverTrigger>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Не помогло</p>
                            </TooltipContent>
                        </Tooltip>
                        <PopoverContent 
                            side="top" 
                            align="center"
                            className="w-64 z-50 bg-white/80 backdrop-blur-md border-gray-300 text-black rounded-xl p-3 shadow-lg"
                        >
                            <div className="grid grid-cols-2 gap-2">
                                {DISLIKE_REASONS.map((reason) => (
                                    <Button
                                        key={reason.code}
                                        variant="outline"
                                        className="h-auto justify-center text-center whitespace-normal p-2 text-xs
                                                   bg-gray-100 border-gray-300 hover:bg-red-100 hover:border-red-400 
                                                   active:scale-95 transition-all duration-150 rounded-lg text-gray-800"
                                        onClick={() => handleDislikeReasonClick(reason)}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : reason.label}
                                    </Button>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onOpenFeedback}
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

function BotMessage({ content, typing, onOpenFeedback, responseTime, currentUser }: { content: any, typing?: boolean, onOpenFeedback: () => void, responseTime?: number, currentUser: FirebaseUser | null }) {
    if (typing) {
        return <TypingIndicator />;
    }

    let displayContent: any;
    let actualContent = content;

    if (React.isValidElement(content)) {
        displayContent = content;
        actualContent = null; 
    } else if (typeof content === 'string') {
        displayContent = content;
        actualContent = null;
    } else if (content && typeof content === 'object') {
        let textObject = content.text;
        if(typeof textObject === 'string') {
            try {
                const parsed = JSON.parse(textObject);
                 if (parsed && typeof parsed === 'object') {
                    textObject = parsed;
                }
            } catch (e) {
                // Not a JSON string
            }
        }

        if (textObject && typeof textObject === 'object' && textObject.text) {
             actualContent = textObject;
             displayContent = actualContent.text;
        } else if (typeof textObject === 'string') {
            actualContent = content;
            displayContent = textObject;
        } else if (typeof content.output === 'string') {
            actualContent = content;
            displayContent = content.output;
        } else {
            displayContent = <pre className="text-xs"><code>{JSON.stringify(content, null, 2)}</code></pre>;
            actualContent = null;
        }
    } else {
        displayContent = "Сообщение не распознано.";
        actualContent = null;
    }
    
    const feedbackBlacklist = [
        "Отправляем на проверку",
        "Ошибка при ответе ИИ"
    ];
    
    let showFeedback = true;
    let contentString = '';
    if (typeof displayContent === 'string') {
        contentString = displayContent;
    } else if (React.isValidElement(displayContent) && typeof (displayContent.props as any).children === 'string') {
        contentString = (displayContent.props as any).children;
    }

    if (!actualContent || !contentString.trim() || (feedbackBlacklist.some(phrase => contentString.includes(phrase)))) {
        showFeedback = false;
    }

    return (
        <div>
            <div className="text-sm break-words whitespace-pre-wrap">{displayContent}</div>
            {showFeedback && <FeedbackIcons onOpenFeedback={onOpenFeedback} responseTime={responseTime} content={actualContent} currentUser={currentUser} />}
        </div>
    );
}

export default function ChatUI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isPending, setIsPending] = useState(false);
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

  const handleSend = async (feedback?: { case: Case; summary: string }) => {
    if (!currentUser) return;
    const trimmedInput = input.trim();
    if (!trimmedInput && !feedback) return;
    if (isPending) return;

    let userMessageContent: string;
    const startTime = Date.now();
    
    let requestData: {
      message: string;
      sessionId: string;
      review?: boolean;
      review_message?: string;
      site?: boolean;
      bz?: boolean;
      telegram?: boolean;
      cases?: Case[];
    };

    if (feedback) {
        userMessageContent = `Отзыв: ${feedback.summary}`;
        requestData = {
          message: '',
          sessionId: currentUser.uid,
          review: true,
          review_message: feedback.summary,
          cases: [feedback.case],
        };
    } else {
        userMessageContent = trimmedInput;
        requestData = {
          message: trimmedInput,
          sessionId: currentUser.uid,
          site: siteEnabled,
          bz: bzEnabled,
          telegram: telegramEnabled,
          review: false,
        };
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
    setIsPending(true);

    const result = await sendMessage(requestData);
    setIsPending(false);
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    let botContent: any;
    
    if (result?.response) {
      try {
          const parsedResponse = JSON.parse(result.response);
          const responseData = parsedResponse[0];
          botContent = {text: responseData, logs: result.logs};

      } catch (e) {
          botContent = { text: result.response, logs: result.logs };
      }
    } else if (result?.error) {
      const errorString = Array.isArray(result.error) ? result.error.join('\n') : result.error;
      botContent = { text: <span className="text-destructive">Ошибка: {errorString}</span>, logs: result.logs };
    } else {
      botContent = { text: <span className="text-destructive">Произошла неизвестная ошибка.</span> };
    }
    
    const botMessage: Message = {
      id: Date.now() + 1,
      role: 'bot',
      content: botContent,
      responseTime,
    };
    
    setMessages(prev => [...prev.filter(m => !m.typing), botMessage]);

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
        <Card className="w-full h-full flex flex-col shadow-2xl bg-card rounded-none">
        <CardHeader className="border-b p-3">
          <div className="flex w-full items-center justify-between gap-4">
            <div className="flex flex-col gap-1 w-24">
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
            <CardTitle className="font-headline text-xl text-center flex-1">
              ИИ Ментор
            </CardTitle>
            <div className="w-24"></div>
          </div>
        </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-4">
                <ScrollArea className="h-full">
                <div className="space-y-2 pr-4">
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
                                        onOpenFeedback={() => openFeedbackModal(message.content.text)}
                                        responseTime={message.responseTime}
                                        currentUser={currentUser}
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
            <CardFooter className="border-t pt-3 pb-3">
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
                    className="flex items-center gap-3"
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

