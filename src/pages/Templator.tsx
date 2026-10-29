import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, ChevronDown, ChevronRight, Plus, Copy } from 'lucide-react';
import { sendTemplatorMessage } from '@/services/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
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
import { onAuthStateChange } from '@/lib/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

type Message = {
  id: number;
  role: 'user' | 'bot';
  content: React.ReactNode;
  logs?: string[];
};

function CodeBlock({ code }: { code: string }) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setIsCopied(true);
      toast({ title: 'Скопировано!', description: 'Код скопирован в буфер обмена.' });
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <div className="relative">
      <pre className="text-xs whitespace-pre-wrap font-mono bg-slate-800 text-white p-4 rounded-md mt-1">
        <code>{code}</code>
      </pre>
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-2 right-2 h-8 w-8"
        onClick={handleCopy}
      >
        <Copy className="h-4 w-4" />
      </Button>
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

function BotMessage({ content, logs }: { content: React.ReactNode, logs?: string[] }) {
    
    const renderContent = (content: React.ReactNode) => {
        if (typeof content === 'string') {
            const codeBlockRegex = /```razor\n([\s\S]*?)\n```/;
            const match = content.match(codeBlockRegex);

            if (match) {
                const code = match[1];
                const parts = content.split(match[0]);
                return (
                    <>
                        {parts[0] && <p>{parts[0]}</p>}
                        <CodeBlock code={code} />
                        {parts[1] && <p>{parts[1]}</p>}
                    </>
                );
            }
        }
        return content;
    }
    
    return (
        <div>
            <div className="text-sm break-words">{renderContent(content)}</div>
            {logs && logs.length > 0 && <LogMessage logs={logs} />}
        </div>
    );
}

export default function Templator() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isPending, setIsPending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [templateCode, setTemplateCode] = useState('');
  const [modalCode, setModalCode] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setCurrentUser(user);
      if (!user) {
        setMessages([]);
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

  const handleSaveCode = () => {
    setTemplateCode(modalCode);
    setIsCodeModalOpen(false);
  };

  const handleDeleteCode = () => {
    setTemplateCode('');
    setModalCode('');
    setIsCodeModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser) return;
    const trimmedInput = input.trim();
    if (!trimmedInput || isPending) return;

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: trimmedInput,
    };
    setMessages(prev => [...prev, userMessage]);

    let prompt = `Imagine that you are a C# developer. Generate a Razor template for a check based on the following request: ${trimmedInput}`;
    if (templateCode) {
        prompt = `Here is the Razor template to use as a base:\n\n${templateCode}\n\nNow, generate a check based on the following request: ${trimmedInput}`
    }

    setIsPending(true);
    const result = await sendTemplatorMessage({
      message: prompt,
      sessionId: currentUser.uid,
    });
    setIsPending(false);

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
    setMessages(prev => [...prev, botMessage]);

    setInput('');
  };

  return (
    <div className="w-full max-w-4xl mx-auto relative">
        <Card className="w-full h-[85vh] md:h-[80vh] flex flex-col shadow-2xl bg-card">
            <CardHeader className="border-b">
                <CardTitle className="font-headline text-center text-2xl">Шаблонизатор</CardTitle>
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
                                <p className="mt-4 text-lg font-semibold">Чат начат.</p>
                                <p className="text-sm text-muted-foreground">Опишите, какой Razor-шаблон чека вы хотите сгенерировать.</p>
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
                                'max-w-xs lg:max-w-2xl rounded-lg px-4 py-2 shadow-md',
                                message.role === 'user'
                                ? 'bg-primary text-primary-foreground rounded-br-none'
                                : 'bg-muted text-card-foreground rounded-bl-none'
                            )}
                            >
                                {message.role === 'bot' ? (
                                    <BotMessage content={message.content} logs={message.logs} />
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
            <CardFooter className="border-t pt-6">
                <div className="w-full">
                    {templateCode && (
                        <div className="mb-2 text-center">
                            <Button variant="secondary" onClick={() => { setModalCode(templateCode); setIsCodeModalOpen(true); }} className="bg-gray-700 hover:bg-gray-600 text-white">
                                Код шаблона
                            </Button>
                        </div>
                    )}
                    <form
                    onSubmit={handleSubmit}
                    className="w-full flex items-center gap-3"
                    >
                    <Button type="button" size="icon" variant="outline" onClick={() => { setModalCode(templateCode); setIsCodeModalOpen(true); }} disabled={!currentUser}>
                        <Plus className="h-4 w-4" />
                    </Button>
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={
                            !currentUser 
                                ? "Пожалуйста, сначала войдите" 
                                : "Опишите, какой чек вы хотите получить..."
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

        <Dialog open={isCodeModalOpen} onOpenChange={setIsCodeModalOpen}>
            <DialogContent className="bg-gray-900 border-gray-700 text-white sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>Код шаблона</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Textarea 
                        value={modalCode} 
                        onChange={e => setModalCode(e.target.value)} 
                        placeholder="Введите код шаблона Razor..." 
                        rows={15} 
                        className="bg-gray-800 border-gray-600 text-white font-mono"
                    />
                </div>
                <DialogFooter>
                    <Button variant="destructive" onClick={handleDeleteCode} className={!templateCode ? 'hidden' : ''}>Удалить</Button>
                    <div className="flex-grow" />
                    <DialogClose asChild>
                        <Button variant="outline" className="text-gray-200">Отменить</Button>
                    </DialogClose>
                    <Button onClick={handleSaveCode} className="bg-blue-600 hover:bg-blue-700 text-white">Сохранить</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
