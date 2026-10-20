import BlogHub from "@/modules/blog/components/BlogHub";
import BlogGuidesLayout from "@/modules/blog/components/BlogGuidesLayout";
import { useLocation } from "react-router-dom";
import "@/styles/blog/pages/blog-guides.css";

export default function BlogSectionPage() {
  const { pathname } = useLocation();

  if (pathname === "/blog/guias") return <BlogGuidesLayout />;

  return <BlogHub />;
}
