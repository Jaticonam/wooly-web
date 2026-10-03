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

      <span className="catalogSectionHeaderCount">
        <span aria-hidden="true">·</span>
        <strong>{count}</strong>
        <span className="catalogSectionHeaderCountLabel">
          {count === 1 ? "producto" : "productos"}
        </span>
      </span>
    </div>
  );
}
