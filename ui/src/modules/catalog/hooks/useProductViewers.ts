import { useEffect, useState } from "react";

export function useProductViewers() {
  const [viewers, setViewers] = useState(
    Math.floor(Math.random() * 8) + 6
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setViewers(Math.floor(Math.random() * 8) + 6);
    }, 6000);

    return () => window.clearInterval(interval);
  }, []);

  return viewers;
}
