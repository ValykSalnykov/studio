
import ChatUI from '../components/chat-ui';
import UserAuth from '../components/user-auth';

// Main page component
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="w-full">
        <div className="flex justify-end p-4">
            <UserAuth />
        </div>
        <ChatUI />
      </div>
    </main>
  );
}
