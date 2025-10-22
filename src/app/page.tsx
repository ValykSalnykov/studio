
import ChatUI from '../components/chat-ui';
import UserAuth from '../components/user-auth';

export default function Home() {
  return (
    <div className="w-full max-w-4xl mx-auto h-full flex flex-col">
      <header className="flex justify-end p-4 sticky top-0 bg-gray-900 z-10">
        <UserAuth />
      </header>
      <div className="flex-1 flex items-center justify-center">
          <ChatUI />
      </div>
    </div>
  );
}
