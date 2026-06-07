import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { clearSession, getSession } from "../utils/auth";
import { logActivity } from "../utils/activityLog";

const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos

export function useSessionTimeout() {
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (!getSession()) return;

      timerRef.current = setTimeout(() => {
        const email = getSession()?.email ?? "";
        logActivity("Sessão encerrada", "Logout automático por inatividade (30 min)");
        clearSession();
        navigate("/", { state: { email, motivo: "inatividade" } });
      }, TIMEOUT_MS);
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [navigate]);
}
