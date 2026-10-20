import { Menu, X } from "lucide-react";
import { useState } from "react";
import BlogSidebarMenu from "./BlogSidebarMenu";

export default function BlogMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="blog-mobile-header" onClick={() => setOpen(true)}>
        <span className="blog-mobile-header-icon">
          <Menu size={18} />
        </span>

        <div className="blog-mobile-header-text">
          <strong>Centro Wooly</strong>
          <small>Explorar recursos</small>
        </div>
      </button>

      <div
        className={
          open ? "blog-mobile-menu-overlay open" : "blog-mobile-menu-overlay"
        }
        onClick={() => setOpen(false)}
      />

      <aside
        className={
          open ? "blog-mobile-menu-panel open" : "blog-mobile-menu-panel"
        }
      >
        <div className="blog-mobile-menu-head">
          <strong>Centro Wooly</strong>
          <button onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <BlogSidebarMenu onNavigate={() => setOpen(false)} />
      </aside>
    </>
  );
}
