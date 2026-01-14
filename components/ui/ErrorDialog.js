import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function ErrorDialog({
  isOpen,
  onClose,
  title,
  message,
  actionMessage,
  onRetry,
  retryText = "Tentar Novamente",
  closeText = "Fechar",
}) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {message}
            {actionMessage && <p className="mt-2">{actionMessage}</p>}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {onRetry && (
            <AlertDialogAction onClick={onRetry}>{retryText}</AlertDialogAction>
          )}
          <AlertDialogCancel onClick={onClose}>{closeText}</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
