import { useEffect } from "react";

export function useFaqSchema(faq?:{q:string;a:string}[]){
  useEffect(()=>{
    if(!faq?.length) return;

    document.getElementById("faq-schema")?.remove();

    const schema={
      "@context":"https://schema.org",
      "@type":"FAQPage",
      mainEntity:faq.map(f=>({
        "@type":"Question",
        name:f.q,
        acceptedAnswer:{
          "@type":"Answer",
          text:f.a
        }
      }))
    };

    const s=document.createElement("script");
    s.id="faq-schema";
    s.type="application/ld+json";
    s.text=JSON.stringify(schema);
    document.head.appendChild(s);

    return()=>s.remove();
  },[faq]);
}
