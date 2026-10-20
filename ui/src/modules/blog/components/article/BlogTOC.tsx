export default function BlogTOC({
  sections,
}: {
  sections: { title: string }[];
}) {
  return (
    <nav className="blog-toc">
      <h3>Contenido</h3>

      <ul>
        {sections.map((s, i) => (
          <li key={i}>
            <a href={`#section-${i}`}>{s.title}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
