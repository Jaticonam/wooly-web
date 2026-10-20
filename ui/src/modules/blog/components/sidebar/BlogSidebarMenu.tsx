import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { HUB_ROUTES } from "../../config/hubNavigation";

export default function BlogSidebarMenu({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const { pathname, search } = useLocation();
  const currentUrl = `${pathname}${search}`;
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <nav className="blog-sidebar-menu">
      {HUB_ROUTES.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        const expandedNow = expanded === item.href;

        return (
          <div key={item.id} className="blog-menu-group">
            <div className="blog-menu-row">
              <Link
                to={item.href}
                onClick={onNavigate}
                className={active ? "active" : ""}
              >
                <Icon size={17} />
                <span>{item.label}</span>
              </Link>

              {item.children && (
                <button
                  type="button"
                  onClick={() => setExpanded(expandedNow ? null : item.href)}
                  className="blog-menu-expand"
                >
                  <ChevronDown
                    size={15}
                    className={expandedNow ? "open" : ""}
                  />
                </button>
              )}
            </div>

            {item.children && expandedNow && (
              <div className="blog-submenu">
                {item.children.map((child) => (
                  <Link
                    key={child.id}
                    to={child.href}
                    onClick={onNavigate}
                    className={currentUrl === child.href ? "active" : ""}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
