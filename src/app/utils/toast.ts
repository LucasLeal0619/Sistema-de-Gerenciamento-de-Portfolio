import { toast as sonnerToast } from "sonner";

export function toastSuccess(message: string) {
  sonnerToast.success(message, { duration: 4500 });
}

export function toastError(message: string, description?: string) {
  sonnerToast.error(message, { duration: 6000, description });
}

export function toastInfo(message: string) {
  sonnerToast.info(message, { duration: 4500 });
}
