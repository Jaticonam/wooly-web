import { useMemo } from "react";
import type { BlogArticle } from "../types/blog";

export function useBlogSearch(articles:BlogArticle[],q:string,cat?:string){
  return useMemo(()=>{
    let items=[...articles];

    if(cat&&cat!=="all") items=items.filter(a=>a.category===cat);

    if(q.trim()){
      const s=q.toLowerCase();
      items=items.filter(a=>
        a.title.toLowerCase().includes(s)||
        a.excerpt.toLowerCase().includes(s)||
        a.tags?.some(t=>t.toLowerCase().includes(s))
      );
    }

    return items;
  },[articles,q,cat]);
}
