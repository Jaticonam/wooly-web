import { useMemo, useRef, useState } from "react";
import type { Product } from "@wooly/contracts/types/product";

import { detectCategory } from "@/modules/search/utils/detectCategory";
import { getResultsCount } from "@/modules/search/utils/getResultsCount";
import { getSuggestions } from "@/modules/search/utils/getSuggestions";

import { useSearchShortcut } from "@/modules/search/hooks/useSearchShortcut";
import { useSearchUrlSync } from "@/modules/search/hooks/useSearchUrlSync";
import { useSearchNavigation } from "@/modules/search/hooks/useSearchNavigation";
import { useSearchKeyboard } from "@/modules/search/hooks/useSearchKeyboard";

import { SearchTopSearches } from "@/modules/search/components/SearchTopSearches";
import { SearchSuggestions } from "@/modules/search/components/SearchSuggestions";
import { SearchBox } from "@/modules/search/components/SearchBox";

interface Props {
  value: string;
  onChange: (value: string) => void;
  products?: Product[];
  placeholder?: string;
}

export function SearchInput({
  value,
  onChange,
  products = [],
  placeholder = "Busca productos...",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isFocused, setFocused] = useState(false);

  useSearchShortcut(inputRef);
  useSearchUrlSync(onChange, setFocused, setActiveIndex);

  const hasValue = value.trim().length > 0;

  const suggestions = useMemo(
    () => getSuggestions(products, value),
    [products, value]
  );

  const detected = useMemo(
    () => detectCategory(value),
    [value]
  );

  const count = useMemo(
    () => getResultsCount(products, value),
    [products, value]
  );

  const { goToProduct, goToCategory } = useSearchNavigation(
    value,
    onChange,
    setActiveIndex,
    setFocused
  );

  const total = suggestions.length + (hasValue ? 1 : 0);

  const keyboard = useSearchKeyboard(
    activeIndex,
    setActiveIndex,
    total,
    suggestions.length,
    () => goToProduct(suggestions[activeIndex]),
    () => setFocused(false),
    () => {
      setFocused(false);
      setActiveIndex(-1);
      onChange("");
    }
  );

  return (
    <div className="relative">
      <SearchBox
        inputRef={inputRef}
        value={value}
        placeholder={placeholder}
        hasValue={hasValue}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          onChange(event.target.value);
          setFocused(true);
          setActiveIndex(-1);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        onKeyDown={keyboard}
        onClear={() => onChange("")}
      />

      {isFocused && !hasValue && (
        <SearchTopSearches
          onSelect={(term) => {
            onChange(term);
            setFocused(false);
            setActiveIndex(-1);
          }}
        />
      )}

      {isFocused && (
        <SearchSuggestions
          value={value}
          hasValue={hasValue}
          detectedCategory={detected}
          suggestions={suggestions}
          resultsCount={count}
          activeIndex={activeIndex}
          onCategoryClick={() => detected && goToCategory(detected)}
          onProductHover={setActiveIndex}
          onProductClick={goToProduct}
          onResultsHover={() => setActiveIndex(suggestions.length)}
          onResultsClick={() => setFocused(false)}
        />
      )}
    </div>
  );
}
