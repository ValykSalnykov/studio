
import { useState, useEffect } from 'react';
import { signUp, signIn, logOut, onAuthStateChange } from '../lib/auth';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { LogOut } from 'lucide-react';
import { AccountModal } from './account-modal';

export default function UserAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      if (user) {
        const appUser = {
          uid: user.uid,
          email: user.email,
          displayName: 'Тестович Тест', // Устанавливаем тестовое имя
        };
        setUser(appUser);
        setIsDialogOpen(false);
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignUp = async () => {
    const { error } = await signUp(email, password);
    if (error) {
      setError(error);
    } else {
      setError(null);
    }
  };

  const handleSignIn = async () => {
    const { error } = await signIn(email, password);
    if (error) {
      setError(error);
    } else {
      setError(null);
    }
  };

  const handleSignOut = async () => {
    await logOut();
    setEmail('');
    setPassword('');
    setError(null);
  };

  const handleAccountClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsAccountModalOpen(true);
  };

  const renderUserDisplayName = () => {
    if (!user?.displayName) {
      return <div className="hover:text-gray-200">Мій аккаунт</div>;
    }

    const nameParts = user.displayName.split(' ');
    const lastName = nameParts.length > 0 ? nameParts[0] : '';
    const firstName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    return (
      <div className="text-right leading-tight">
        <div>{lastName}</div>
        <div>{firstName}</div>
      </div>
    );
  }

  return (
    <div>
      {user ? (
        <>
          <div className='flex items-center space-x-4 text-sm font-medium text-white'>
            <a href="#" onClick={handleAccountClick} className="hover:text-gray-200">
                {renderUserDisplayName()}
            </a>
            <button onClick={handleSignOut} className="flex items-center space-x-1.5 hover:text-gray-200">
                <LogOut size={16} />
                <span>Вийти</span>
            </button>
          </div>
          <AccountModal open={isAccountModalOpen} onOpenChange={setIsAccountModalOpen} user={user} />
        </>
      ) : (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-amber-400 text-amber-400 hover:bg-amber-400 hover:text-gray-900">
                Вхід / Реєстрація
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Вхід</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
              />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Пароль"
                className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className='flex justify-between'>
                <Button onClick={handleSignIn} className="bg-amber-500 hover:bg-amber-600 text-black">Увійти</Button>
                <Button onClick={handleSignUp} variant="secondary" className="bg-gray-600 hover:bg-gray-700 text-white">Зареєструватися</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
