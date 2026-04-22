import * as Dialog from '@radix-ui/react-dialog';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  variant = 'danger'
}: ConfirmModalProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content className="fixed inset-0 z-[101] flex items-center justify-center p-4 focus:outline-none">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl animate-fade-in-up">
          <div className="flex items-start gap-4">
            <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              variant === 'danger' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
            }`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-2">
              <Dialog.Title className="text-lg font-bold leading-none tracking-tight">
                {title}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground leading-relaxed">
                {description}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="rounded-full p-1 text-muted-foreground hover:bg-muted transition" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="h-10 px-4 rounded-xl border text-sm font-medium hover:bg-muted transition active:scale-95"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`h-10 px-6 rounded-xl text-sm font-bold shadow-lg transition active:scale-95 ${
                variant === 'danger' 
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-destructive/20' 
                  : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
