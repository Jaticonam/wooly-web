import { BookOpen, ShoppingBag, Layout, Calendar, TrendingUp } from "lucide-react";

export const BLOG_CATEGORIES=[
  {id:"ideas",name:"Ideas de negocio",icon:BookOpen},
  {id:"productos",name:"Guías de productos",icon:ShoppingBag},
  {id:"tutoriales",name:"Tutoriales",icon:Layout},
  {id:"fechas",name:"Fechas comerciales",icon:Calendar},
  {id:"tendencias",name:"Tendencias",icon:TrendingUp},
] as const;
