export type BlogBlockType=
|"hero"
|"paragraph"
|"list"
|"tip"
|"warning"
|"checklist"
|"cta"
|"faq";

export interface BlogTemplate{
 id:string;
 blocks:BlogBlockType[];
}

export const BLOG_TEMPLATES:Record<string,BlogTemplate>={

guide:{
 id:"guide",
 blocks:[
 "hero",
 "paragraph",
 "list",
 "tip",
 "cta",
 "faq"
 ]
},

business:{
 id:"business",
 blocks:[
 "hero",
 "paragraph",
 "checklist",
 "tip",
 "cta"
 ]
},

strategy:{
 id:"strategy",
 blocks:[
 "hero",
 "paragraph",
 "warning",
 "list",
 "tip",
 "cta"
 ]
},

campaign:{
 id:"campaign",
 blocks:[
 "hero",
 "paragraph",
 "list",
 "checklist",
 "cta"
 ]
},

tutorial:{
 id:"tutorial",
 blocks:[
 "hero",
 "paragraph",
 "list",
 "tip",
 "cta"
 ]
}

};
