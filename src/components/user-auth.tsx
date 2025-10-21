'use client';

import { useState } from 'react';
import { LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define the user structure and mock data
export type MockUser = {
  id: string;
  name: string;
  sessionId: string;
};

export const mockUsers: MockUser[] = [
  { id: '1', name: 'Alice', sessionId: 'alice-session-123' },
  { id: '2', name: 'Bob', sessionId: 'bob-session-456' },
  { id: '3', name: 'Charlie', sessionId: 'charlie-session-789' },
];

type UserAuthProps = {
  currentUser: MockUser | null;
  onLogin: (userId: string) => void;
  onLogout: () => void;
};

export function UserAuth({ currentUser, onLogin, onLogout }: UserAuthProps) {
  return (
    <div className="absolute top-4 right-4 z-10">
      {currentUser ? (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Welcome, {currentUser.name}</span>
          <Button onClick={onLogout} size="sm" variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              <LogIn className="h-4 w-4 mr-2" />
              Login As
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {mockUsers.map(user => (
              <DropdownMenuItem key={user.id} onClick={() => onLogin(user.id)}>
                {user.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}