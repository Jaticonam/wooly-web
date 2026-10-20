import type { RecentActivityData } from "@/modules/feedback/hooks/useRecentActivity";

interface RecentActivityCardProps {
  data: RecentActivityData;
  leaving: boolean;
}

export function RecentActivityCard({ data, leaving }: RecentActivityCardProps) {
  const initial = data.name.charAt(0).toUpperCase();
  const timeText = data.time <= 2 ? "hace unos segundos" : `hace ${data.time} min`;

  return (
    <div
      className={`recent-activity ${
        leaving ? "animate-recent-activity-out" : "animate-recent-activity-in"
      }`}
    >
      <div className="recent-activity-card">
        <div className="recent-activity-avatar">{initial}</div>

        <div className="min-w-0 flex-1">
          <p className="recent-activity-text">
            <strong>{data.name}</strong> de <span>{data.place}</span>{" "}
            {data.action} <b>{data.product}</b>
          </p>

          <p className="recent-activity-time">{timeText}</p>
        </div>
      </div>
    </div>
  );
}