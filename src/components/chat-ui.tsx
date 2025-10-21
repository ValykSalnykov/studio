'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { Send, Bot, User, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
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

type Message = {
  id: number;
  role: 'user' | 'bot';
  content: React.ReactNode;
  logs?: string[];
};

function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <Button type="submit" size="icon" disabled={isPending} aria-label="Send message" className="bg-accent hover:bg-accent/90">
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
            Technical Details
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
    return (
        <div>
            <div className="text-sm break-words">{content}</div>
            {logs && logs.length > 0 && <LogMessage logs={logs} />}
        </div>
    );
}

export function ChatUI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isPending, startTransition] = useTransition();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isPending) return;

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: trimmedInput,
    };
    setMessages(prev => [...prev, userMessage]);

    const formData = new FormData();
    formData.append('message', trimmedInput);

    startTransition(async () => {
      const result = await sendMessage(null, formData);

      let botContent: React.ReactNode;
      let logs: string[] | undefined;
      
      if (result?.response) {
        botContent = result.response;
        logs = result.logs
      } else if (result?.error) {
        const errorString = Array.isArray(result.error) ? result.error.join('\n') : result.error;
        botContent = <span className="text-destructive">Error: {errorString}</span>;
        logs = result.logs;
      } else {
        botContent = <span className="text-destructive">An unknown error occurred.</span>;
      }
      
      const botMessage: Message = {
        id: Date.now() + 1,
        role: 'bot',
        content: botContent,
        logs: logs,
      };
      setMessages(prev => [...prev, botMessage]);
    });

    setInput('');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto h-[90vh] md:h-[80vh] flex flex-col shadow-2xl bg-card">
      <CardHeader className="border-b">
        <CardTitle className="font-headline text-center text-2xl">Webhook Chat</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-6">
        <ScrollArea className="h-full">
          <div className="space-y-6 pr-4">
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
                    'max-w-xs lg:max-w-md rounded-lg px-4 py-2 shadow-md',
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
             <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="border-t pt-6">
        <form
          onSubmit={handleSubmit}
          className="w-full flex items-center gap-3"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            autoComplete="off"
            disabled={isPending}
            className="text-base"
          />
          <SubmitButton isPending={isPending} />
        </form>
      </CardFooter>
    </Card>
  );
}
