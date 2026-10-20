import TopBar from "@/modules/home/components/TopBar";
import HomeHeader from "@/modules/home/components/HomeHeader";
import ActiveCampaignHero from "@/modules/home/components/CampaignHero/ActiveCampaignHero";

import FeaturedProductsSection from "@/modules/home/components/FeaturedProductsSection";
import GrowthCenterSection from "@/modules/home/components/GrowthCenterSection";
import CategoriesSection from "@/modules/home/components/CategoriesSection";
import HowToBuySection from "@/modules/home/components/HowToBuySection";
import BenefitsSection from "@/modules/home/components/BenefitsSection";
import StatsSection from "@/modules/home/components/StatsSection";
import ShippingSection from "@/modules/home/components/ShippingSection";
import VipSection from "@/modules/home/components/VipSection";
import BrandStorySection from "@/modules/home/components/BrandStorySection";
import TestimonialsSection from "@/modules/home/components/TestimonialsSection";
import FinalCTASection from "@/modules/home/components/FinalCTASection";
import SocialSection from "@/modules/home/components/SocialSection";
import HomeFooter from "@/modules/home/components/HomeFooter";

import { FloatingButtons } from "@/components/layout/FloatingButtons";
import { useCartStore } from "@/modules/cart/store";

export default function HomePage(){
  const {totalItems}=useCartStore();

  return(
    <div className="min-h-screen overflow-x-hidden bg-background font-sans">
      <TopBar/>
      <HomeHeader/>
      <ActiveCampaignHero/>
      
      <FeaturedProductsSection/>
      <GrowthCenterSection/>
      <CategoriesSection/>
      <HowToBuySection/>
      <BenefitsSection/>
      <StatsSection/>
      <ShippingSection/>
      <VipSection/>
      <BrandStorySection/>
      <TestimonialsSection/>
      <FinalCTASection/>
      <SocialSection/>
      <HomeFooter/>
      <FloatingButtons
        cartCount={totalItems}
        onCartClick={()=>{window.location.href="/catalogo";}}
        variant="home"
      />
    </div>
  );
}