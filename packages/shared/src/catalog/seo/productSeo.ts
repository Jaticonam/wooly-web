import type { Product } from "@wooly/contracts/types/product";
import {
  buildProductPublicUrl,
  buildPublicUrl,
  getApplicationConfig,
} from "../../config/application";

export interface ProductSeoData {
  title: string;
  description: string;
  canonical: string;
  image: string;
}

const clean=(value?:string)=>String(value||"").trim();

export const getProductSeo=(product?:Product|null,id?:string):ProductSeoData=>{
  const config = getApplicationConfig();
  const defaultImage = buildPublicUrl(config.assets.defaultSeoImageUrl, config);
  if(!product){
    return {
      title:`Producto mayorista | ${config.app.name}`,
      description:`Explora productos mayoristas para emprendedores en ${config.app.name}.`,
      canonical:buildProductPublicUrl(id ?? "", undefined, config),
      image:defaultImage,
    };
  }

  const title=`${clean(product.title)} | ${config.app.name}`;
  const description=clean(product.description)||`Compra ${clean(product.title)} por mayor en ${config.app.name}. Productos para emprendedores con envíos a todo el Perú.`;
  const canonical=buildProductPublicUrl(product.id, product.category, config);
  const image=clean(product.img)||defaultImage;

  return {title,description,canonical,image};
};
