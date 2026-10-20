import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export function useSearchUrlSync(
  onChange: (value: string) => void,
  setIsFocused: (value: boolean) => void,
  setActiveIndex: (value: number) => void
) {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const term = searchParams.get("search");

    if (!term) return;

    onChange(term.trim());
    setIsFocused(false);
    setActiveIndex(-1);
  }, [searchParams, onChange, setIsFocused, setActiveIndex]);
}
