type BlogGuidesStatsProps = {
  stats: {
    guides: number;
    categories: number;
    tags: number;
  };
};

export default function BlogGuidesStats({ stats }: BlogGuidesStatsProps) {
  return (
    <div className="blog-guides-stats">
      <div className="blog-guides-stat">
        <span>📖</span>
        <strong>{stats.guides}</strong>
        <small>guías prácticas</small>
      </div>

      <div className="blog-guides-stat">
        <span>📂</span>
        <strong>{stats.categories}</strong>
        <small>categorías</small>
      </div>

      <div className="blog-guides-stat">
        <span>🏷</span>
        <strong>{stats.tags}</strong>
        <small>temas clave</small>
      </div>
    </div>
  );
}
