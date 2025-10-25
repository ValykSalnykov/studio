'use client';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

export function AccountModal({ open, onOpenChange, user }: { open: boolean, onOpenChange: (open: boolean) => void, user: any }) {
  const [role, setRole] = useState<string | null>(null);
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Мій аккаунт</AlertDialogTitle>
          <AlertDialogDescription>
            Тут ви можете переглянути дані свого аккаунту.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {user && (
          <div className="space-y-4">
            <p>Email: {user.email}</p>
            <div>
              <Label htmlFor="role-select">Роль</Label>
              <Select onValueChange={setRole} defaultValue={role ?? undefined}>
                <SelectTrigger id="role-select">
                  <SelectValue placeholder="Виберіть роль" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mentor">Ментор</SelectItem>
                  <SelectItem value="team-lead">Тим-лид</SelectItem>
                  <SelectItem value="on-duty">Дежурный</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Закрити</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
