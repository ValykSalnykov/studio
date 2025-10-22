
import ChatUI from '../components/chat-ui';

export default function Home() {
  return (
    <div className="w-full max-w-4xl mx-auto h-full flex flex-col">
      <div className="flex-1 flex items-center justify-center">
          <ChatUI />
      </div>
    </div>
  );
}
