
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
      <AlertDialogContent className="bg-gray-900 text-gray-50 border-gray-700">
        <AlertDialogHeader>
          <AlertDialogTitle>Мій аккаунт</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            Тут ви можете переглянути дані свого аккаунту.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {user && (
          <div className="space-y-4">
            <div>
              <Label>Ім'я та прізвище</Label>
              <p className="text-sm text-gray-300 mt-1">{user.displayName || 'Не вказано'}</p>
            </div>
            <div>
              <Label>Email</Label>
              <p className="text-sm text-gray-300 mt-1">{user.email}</p>
            </div>
            <div>
              <Label htmlFor="role-select">Роль</Label>
              <Select onValueChange={setRole} defaultValue={role ?? undefined}>
                <SelectTrigger id="role-select" className="w-full bg-gray-800 border-gray-600 text-gray-50 mt-1">
                  <SelectValue placeholder="Виберіть роль" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-gray-50 border-gray-600">
                  <SelectItem value="mentor">Ментор</SelectItem>
                  <SelectItem value="team-lead">Тим-лид</SelectItem>
                  <SelectItem value="on-duty">Дежурный</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-gray-700 text-gray-50 hover:bg-gray-600 border-0">Закрити</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
