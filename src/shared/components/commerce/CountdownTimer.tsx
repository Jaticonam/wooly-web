import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

type UrgencyLevel = "normal" | "warning" | "danger";

const dispatchDays = [1, 3, 5];
const cutoffHour = 16;

const getNextDispatch = () => {
  const now = new Date();
  const today = now.getDay();
  const todayCutoff = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    cutoffHour,
    0,
    0,
  );

  if (dispatchDays.includes(today) && now < todayCutoff) {
    return todayCutoff;
  }

  for (let i = 1; i <= 7; i++) {
    const next = new Date(now);
    next.setDate(now.getDate() + i);

    if (dispatchDays.includes(next.getDay())) {
      next.setHours(cutoffHour, 0, 0);
      return next;
    }
  }

  return todayCutoff;
};

export function CountdownTimer() {
  const [time, setTime] = useState("00h : 00m : 00s");
  const [urgency, setUrgency] = useState<UrgencyLevel>("normal");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const date = getNextDispatch();
      const diff = date.getTime() - now.getTime();

      if (diff <= 0) {
        setTime("00h : 00m : 00s");
        setUrgency("danger");
        return;
      }

      const hours = String(Math.floor(diff / 3600000)).padStart(2, "0");
      const minutes = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
      const seconds = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
      const minutesLeft = Math.floor(diff / 60000);

      setTime(`${hours}h : ${minutes}m : ${seconds}s`);
      setUrgency(
        minutesLeft <= 90
          ? "danger"
          : minutesLeft <= 240
            ? "warning"
            : "normal",
      );
    };

    update();

    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className={`countdown-timer countdown-timer-${urgency}`}
      aria-label={`Tiempo restante para el próximo despacho: ${time}`}
    >
      <Timer className="countdown-timer-icon" aria-hidden="true" />

      <strong className="countdown-timer-box">
        {time}
      </strong>
    </div>
  );
}
