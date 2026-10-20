interface Props {
  title?: string;
  icon?: string;
  children: React.ReactNode;
}

export default function BlogSidebarCard({
  title,
  icon,
  children,
}: Props) {
  return (
    <section className="blog-sidebar-card">
      {title && (
        <header className="blog-sidebar-card-head">
          <span>{icon}</span>
          <strong>{title}</strong>
        </header>
      )}

      <div className="blog-sidebar-card-body">{children}</div>
    </section>
  );
}