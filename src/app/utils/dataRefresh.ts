const EVENT = "sgp:data-changed";

export type DataChangeReason =
  | "import"
  | "restore"
  | "snapshot-restore"
  | "clear"
  | "backup";

export function notifyDataChanged(reason?: DataChangeReason) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { reason } }));
}

export function subscribeDataChanged(callback: () => void) {
  const handler = () => callback();
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
