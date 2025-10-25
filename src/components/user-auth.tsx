
'use client';

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
import { Users, LogOut } from 'lucide-react';

export default function UserAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      if (user) {
        setIsDialogOpen(false);
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

  return (
    <div>
      {user ? (
        <div className='flex items-center space-x-6 text-sm font-medium text-white'>
          <a href="#" className="flex items-center space-x-1.5 hover:text-gray-200">
              <Users size={16} />
              <span>Про мій аккаунт</span>
          </a>
          <button onClick={handleSignOut} className="flex items-center space-x-1.5 hover:text-gray-200">
              <LogOut size={16} />
              <span>Вийти</span>
          </button>
        </div>
      ) : (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Вхід / Реєстрація</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Вхід</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
              />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Пароль"
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className='flex justify-between'>
                <Button onClick={handleSignIn}>Увійти</Button>
                <Button onClick={handleSignUp}>Зареєструватися</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
