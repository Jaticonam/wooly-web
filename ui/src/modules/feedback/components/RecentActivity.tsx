import type { Product } from "@wooly/contracts/types/product";

import { useRecentActivity } from "@/modules/feedback/hooks/useRecentActivity";
import { RecentActivityCard } from "@/modules/feedback/components/RecentActivityCard";

interface RecentActivityProps {
  products: Product[];
}

export function RecentActivity({
  products,
}: RecentActivityProps) {
  const {
    visible,
    leaving,
    data,
  } = useRecentActivity(products);

  if (!visible) return null;

  return (
    <RecentActivityCard
      data={data}
      leaving={leaving}
    />
  );
}
