import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

interface Props {
  children: React.ReactNode;
}

export function AOSProvider({ children }: Props) {
  useEffect(() => {
    AOS.init({
      duration: 650,
      easing: "ease-out-cubic",
      once: true,
      offset: 70,
      delay: 0,
    });
  }, []);

  return <>{children}</>;
}
