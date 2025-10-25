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

export function AccountModal({ open, onOpenChange, user }: { open: boolean, onOpenChange: (open: boolean) => void, user: any }) {
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
          <div>
            <p>Email: {user.email}</p>
            {/* Add other user data here if available */}
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Закрити</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
