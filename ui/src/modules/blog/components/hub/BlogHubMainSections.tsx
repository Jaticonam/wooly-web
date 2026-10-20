import {
  BlogCatalogSection,
  BusinessToolsSection,
  CampaignCenterSection,
  IdeaLabSection,
  OpportunityCenterSection,
  TrendInsightsSection,
} from "../sections";

export default function BlogHubMainSections() {
  return (
    <>
      <section id="laboratorio">
        <IdeaLabSection />
      </section>

      <section id="tendencias">
        <TrendInsightsSection />
      </section>

      <section id="oportunidades">
        <OpportunityCenterSection />
      </section>

      <section id="herramientas">
        <BusinessToolsSection />
      </section>

      <section id="campanas">
        <CampaignCenterSection />
      </section>

      <section id="catalogo-wooly">
        <BlogCatalogSection />
      </section>
    </>
  );
}
