import { useEffect } from "react";
import { buildPublicUrl } from "@wooly/shared/config/application";

export function useBreadcrumbSchema(title:string,slug:string){
  useEffect(()=>{
    document.getElementById("breadcrumb-schema")?.remove();

    const schema={
      "@context":"https://schema.org",
      "@type":"BreadcrumbList",
      itemListElement:[
        {"@type":"ListItem",position:1,name:"Inicio",item:buildPublicUrl("/")},
        {"@type":"ListItem",position:2,name:"Blog",item:buildPublicUrl("/blog")},
        {"@type":"ListItem",position:3,name:title,item:buildPublicUrl(`/blog/${slug}`)}
      ]
    };

    const s=document.createElement("script");
    s.id="breadcrumb-schema";
    s.type="application/ld+json";
    s.text=JSON.stringify(schema);
    document.head.appendChild(s);

    return()=>s.remove();
  },[title,slug]);
}
