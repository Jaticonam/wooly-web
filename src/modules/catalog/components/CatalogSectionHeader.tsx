import "./CatalogSectionHeader.css";

interface CatalogSectionHeaderProps {
  title: string;
  count: number;
}

export function CatalogSectionHeader({
  title,
  count,
}: CatalogSectionHeaderProps) {
  return (
    <div className="catalogSectionHeader">
      <h2>{title}</h2>

      <span>
        · {count} {count === 1 ? "producto" : "productos"}
      </span>
    </div>
  );
}
