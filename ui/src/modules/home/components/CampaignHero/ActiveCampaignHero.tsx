import type { ComponentType } from "react";

import CampaignHeroDefault from "./CampaignHeroDefault";
import CampaignHeroDiaPadre from "./CampaignHeroDiaPadre";
import CampaignHeroCyber from "./CampaignHeroCyber";

type CampaignHeroKey =
  | "default"
  | "dia-padre"
  | "dia-maestro"
  | "dias-wooly"
  | "cyber"
  | "liquidacion-stock";

const ACTIVE_CAMPAIGN: CampaignHeroKey = "cyber";

const CAMPAIGN_HERO_COMPONENTS: Record<CampaignHeroKey, ComponentType> = {
  default: CampaignHeroDefault,
  "dia-padre": CampaignHeroDiaPadre,
  cyber: CampaignHeroCyber,

  "dia-maestro": CampaignHeroDefault,
  "dias-wooly": CampaignHeroDefault,
  "liquidacion-stock": CampaignHeroDefault,
};

export default function ActiveCampaignHero() {
  const HeroComponent =
    CAMPAIGN_HERO_COMPONENTS[ACTIVE_CAMPAIGN] ?? CampaignHeroDefault;

  return <HeroComponent />;
}