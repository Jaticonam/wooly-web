import { Lightbulb } from "lucide-react";
import type { BlogArticle } from "../../types/blog";

export default function BlogIdeaBox({article}:{article:BlogArticle}){
  return(
    <aside className="blog-idea-box">
      <div><Lightbulb size={22}/></div>
      <div>
        <span>Idea Wooly</span>
        <h3>Convierte esta guía en una oportunidad comercial</h3>
        <p>
          Usa este contenido para elegir mejores insumos, armar propuestas con más valor
          y conectar la idea con productos reales del catálogo.
        </p>
        <small>{article.title}</small>
      </div>
    </aside>
  );
}

