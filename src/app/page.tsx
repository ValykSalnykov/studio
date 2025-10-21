import { ChatUI } from '@/components/chat-ui';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <ChatUI />
    </main>
  );
}
