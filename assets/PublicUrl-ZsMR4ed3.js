import{c as u,g as a}from"./index-MBujAfKI.js";/**
 * @license lucide-react v1.7.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const o=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 6v6l4 2",key:"mmk7yg"}]],n=u("clock",o);function e(t,r=a()){return new URL(t,`${r.publicSite.origin}/`).toString()}function s(t,r,c=a()){const i=new URL(c.routes.productDetail,`${c.publicSite.origin}/`);return t&&i.searchParams.set("id",t),r&&i.searchParams.set("cat",r),i.toString()}function d(t,r,c=a()){const i=new URLSearchParams;return i.set("id",t),r&&i.set("cat",r),`${c.routes.productDetail}?${i.toString()}`}function b(t=a()){return e(t.routes.catalog,t)}function P(t=a()){return e(t.routes.catalogPdf,t)}export{n as C,b as a,e as b,P as c,s as d,d as e};
