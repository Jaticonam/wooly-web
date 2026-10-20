import { Compass, X } from "lucide-react";
import { useState } from "react";
import type { BlogArticle } from "../../types/blog";
import BlogGuidesRail from "./BlogGuidesRail";

export default function BlogExploreSheet({
  articles,
}: {
  articles: BlogArticle[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="blog-explore-floating" onClick={() => setOpen(true)}>
        <Compass size={17} /> Explorar
      </button>

      <div
        className={open ? "blog-explore-overlay open" : "blog-explore-overlay"}
        onClick={() => setOpen(false)}
      />

      <aside
        className={open ? "blog-explore-sheet open" : "blog-explore-sheet"}
      >
        <div className="blog-explore-head">
          <strong>Explorar biblioteca</strong>
          <button onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <BlogGuidesRail articles={articles} />
      </aside>
    </>
  );
}
