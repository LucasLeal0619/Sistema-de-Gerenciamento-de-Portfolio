import { toast as sonnerToast } from "sonner";

export function toastSuccess(message: string) {
  sonnerToast.success(message, { duration: 4500 });
}

export function toastError(message: string) {
  sonnerToast.error(message, { duration: 6000 });
}

export function toastInfo(message: string) {
  sonnerToast.info(message, { duration: 4500 });
}
