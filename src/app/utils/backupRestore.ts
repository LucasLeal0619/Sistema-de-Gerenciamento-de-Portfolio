import { logActivity } from "./activityLog";
import { notifyDataChanged } from "./dataRefresh";
import { getUsuarios } from "./store";

export const BACKUP_VERSION = 1;
export const PRE_IMPORT_SNAPSHOT_KEY = "sgp_snapshot_pre_import";

/** Chaves persistidas no backup (exceto sessão de login). */
export const BACKUP_KEYS = [
  "sgp_usuarios",
  "sgp_plano_metas",
  "sgp_visitas_tecnicas",
  "sgp_horas_pedagogicas",
  "sgp_valores_pca",
  "sgp_cursos_eixo",
  "sgp_acoes_extensivas",
  "sgp_eventos",
  "sgp_ceped_equipe",
  "sgp_stored_courses",
  "sgp_deleted_static_cod_sigs",
  "sgp_atividade_log",
  "sgp_ultimo_email",
  "sgp_import_history",
] as const;

export type PortfolioBackup = {
  version: number;
  exportedAt: string;
  data: Record<string, string | null>;
};

export function capturePortfolioState(): PortfolioBackup {
  const data: Record<string, string | null> = {};
  BACKUP_KEYS.forEach((key) => {
    data[key] = localStorage.getItem(key);
  });
  data.sgp_usuarios = JSON.stringify(getUsuarios());

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
}

export function exportPortfolioBackup(): PortfolioBackup {
  const backup = capturePortfolioState();
  logActivity("Backup exportado", `Arquivo JSON com ${BACKUP_KEYS.length} módulos`);
  return backup;
}

export function savePreImportSnapshot(): PortfolioBackup {
  const backup = capturePortfolioState();
  localStorage.setItem(PRE_IMPORT_SNAPSHOT_KEY, JSON.stringify(backup));
  return backup;
}

export function getPreImportSnapshot(): PortfolioBackup | null {
  try {
    const raw = localStorage.getItem(PRE_IMPORT_SNAPSHOT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PortfolioBackup;
  } catch {
    return null;
  }
}

export function hasPreImportSnapshot(): boolean {
  return getPreImportSnapshot() !== null;
}

export function clearPreImportSnapshot() {
  localStorage.removeItem(PRE_IMPORT_SNAPSHOT_KEY);
}

export function restorePreImportSnapshot(): { ok: true } | { ok: false; error: string } {
  const snapshot = getPreImportSnapshot();
  if (!snapshot) {
    return { ok: false, error: "Nenhum snapshot anterior encontrado." };
  }

  const result = restorePortfolioBackup(snapshot, { logAsSnapshot: true });
  if (result.ok) {
    clearPreImportSnapshot();
  }
  return result;
}

export function downloadPortfolioBackup() {
  const backup = exportPortfolioBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 10);
  const link = document.createElement("a");
  link.href = url;
  link.download = `sgp-backup-${stamp}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function restorePortfolioBackup(
  backup: PortfolioBackup,
  options?: { logAsSnapshot?: boolean; skipNotify?: boolean },
): { ok: true } | { ok: false; error: string } {
  if (!backup || typeof backup !== "object" || !backup.data) {
    return { ok: false, error: "Arquivo de backup inválido." };
  }

  if (backup.version !== BACKUP_VERSION) {
    return { ok: false, error: `Versão de backup incompatível (esperada v${BACKUP_VERSION}).` };
  }

  BACKUP_KEYS.forEach((key) => {
    const value = backup.data[key];
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  });

  if (options?.logAsSnapshot) {
    logActivity("Importação desfeita", `Estado anterior restaurado (${backup.exportedAt.slice(0, 16).replace("T", " ")})`);
  } else {
    logActivity("Backup restaurado", `Dados de ${backup.exportedAt.slice(0, 10)} reaplicados`);
  }

  if (!options?.skipNotify) {
    notifyDataChanged(options?.logAsSnapshot ? "snapshot-restore" : "restore");
  }

  return { ok: true };
}

export async function importPortfolioBackupFile(file: File): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text) as PortfolioBackup;
    return restorePortfolioBackup(parsed);
  } catch {
    return { ok: false, error: "Não foi possível ler o arquivo JSON." };
  }
}
