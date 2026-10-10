import{c}from"./index-u3w-U0yJ.js";/**
 * @license lucide-react v1.7.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const s=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]],y=c("circle-check",s);/**
 * @license lucide-react v1.7.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const m=[["path",{d:"M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z",key:"1s2grr"}],["path",{d:"M20 2v4",key:"1rf3ol"}],["path",{d:"M22 4h-4",key:"gwowj6"}],["circle",{cx:"4",cy:"20",r:"2",key:"6kqj1y"}]],k=c("sparkles",m);/**
 * @license lucide-react v1.7.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p=[["path",{d:"M16 7h6v6",key:"box55l"}],["path",{d:"m22 7-8.5 8.5-5-5L2 17",key:"1t1m79"}]],h=c("trending-up",p),r="/placeholder.svg",l=e=>typeof e=="string"?e.trim():"";function u(e){return l(e)||r}function f(e){e.dataset.productFallbackApplied!=="true"&&(e.dataset.productFallbackApplied="true",e.removeAttribute("srcset"),e.src=r)}function I(e){const n=l(e.gallery).split("|").map(a=>a.trim()).filter(Boolean),i=[e.img,...n].map(l).filter(Boolean),o=Array.from(new Set(i)).map((a,t)=>({id:`${e.id}-image-${t+1}`,type:"image",src:a,thumb:a,alt:t===0?`${e.title} imagen principal`:`${e.title} imagen ${t+1}`,order:t+1}));return o.length?o:[{id:`${e.id}-placeholder`,type:"image",src:r,thumb:r,alt:`Imagen en proceso de ${e.title}`,order:1}]}export{y as C,k as S,h as T,f as a,I as g,u as r};
