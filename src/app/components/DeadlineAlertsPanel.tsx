import { Link } from "react-router";
import { AlertTriangle, CalendarClock } from "lucide-react";
import { getDeadlineAlerts } from "../utils/deadlineAlerts";

export function DeadlineAlertsPanel({ daysAhead = 15 }: { daysAhead?: number }) {
  const alerts = getDeadlineAlerts(daysAhead);

  if (!alerts.length) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
        Nenhum prazo vencendo nos próximos {daysAhead} dias.
      </div>
    );
  }

  const overdue = alerts.filter((a) => a.severity === "overdue");
  const soon = alerts.filter((a) => a.severity === "soon");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 text-xs font-semibold">
        {overdue.length > 0 && (
          <span className="rounded-full bg-red-100 px-3 py-1 text-red-800">
            {overdue.length} vencido(s)
          </span>
        )}
        {soon.length > 0 && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">
            {soon.length} próximo(s)
          </span>
        )}
      </div>
      <ul className="space-y-2">
        {alerts.slice(0, 8).map((alert) => (
          <li
            key={alert.id}
            className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 ${
              alert.severity === "overdue"
                ? "border-red-200 bg-red-50"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {alert.severity === "overdue" ? (
                  <AlertTriangle size={14} className="text-red-600" />
                ) : (
                  <CalendarClock size={14} className="text-amber-600" />
                )}
                <span className="text-sm font-semibold text-gray-900">{alert.label}</span>
              </div>
              {alert.subtitle && (
                <p className="mt-0.5 text-xs text-gray-600">{alert.subtitle}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">{alert.dataLabel}</p>
            </div>
            <div className="shrink-0 text-right">
              <span
                className={`text-xs font-bold ${
                  alert.severity === "overdue" ? "text-red-700" : "text-amber-700"
                }`}
              >
                {alert.daysUntil < 0
                  ? `${Math.abs(alert.daysUntil)}d atraso`
                  : alert.daysUntil === 0
                    ? "Hoje"
                    : `${alert.daysUntil}d`}
              </span>
              <Link
                to={alert.href}
                className="mt-1 block text-[10px] font-semibold text-[#003F7D] underline"
              >
                Abrir
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
