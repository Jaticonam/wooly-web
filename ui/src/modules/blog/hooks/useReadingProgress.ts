import { useEffect, useState } from "react";

export function useReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;

      if (height <= 0) {
        setProgress(0);
        return;
      }

      setProgress((scrollTop / height) * 100);
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress);

    return () => window.removeEventListener("scroll", updateProgress);
  }, []);

  return progress;
}
