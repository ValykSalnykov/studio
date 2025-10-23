
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

export default function UserAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
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
        <div className='flex items-center space-x-4'>
          <p className='text-sm text-gray-500'>Привет, {user.email}</p>
          <Button variant="outline" onClick={handleSignOut}>Выход</Button>
        </div>
      ) : (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Вход / Регистрация</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Логин</DialogTitle>
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
                placeholder="Password"
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className='flex justify-between'>
                <Button onClick={handleSignIn}>Вход</Button>
                <Button onClick={handleSignUp}>Регистрация</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
