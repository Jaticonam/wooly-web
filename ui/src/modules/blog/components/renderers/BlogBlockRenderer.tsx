import { AlertTriangle, Lightbulb } from "lucide-react";
import type { BlogSection } from "../../data/blogArticles";

export default function BlogBlockRenderer({
  sections,
}: {
  sections: BlogSection[];
}) {
  return (
    <>
      {sections.map((s, i) => {
        const type = s.type || "paragraph";

        if (type === "list")
          return (
            <section
              id={`section-${i}`}
              key={i}
              className="blog-content-section"
            >
              <h2>{s.title}</h2>

              <ul className="blog-list">
                {s.items?.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          );

        if (type === "tip")
          return (
            <div
              id={`section-${i}`}
              key={i}
              className="blog-tip blog-content-section"
            >
              <Lightbulb size={22} />

              <div>
                <h3>{s.title}</h3>

                <p>{s.body}</p>
              </div>
            </div>
          );

        if (type === "warning")
          return (
            <div
              id={`section-${i}`}
              key={i}
              className="blog-warning blog-content-section"
            >
              <AlertTriangle size={22} />

              <div>
                <h3>{s.title}</h3>

                <p>{s.body}</p>
              </div>
            </div>
          );

        return (
          <section id={`section-${i}`} key={i} className="blog-content-section">
            <h2>{s.title}</h2>

            <p>{s.body}</p>
          </section>
        );
      })}
    </>
  );
}

