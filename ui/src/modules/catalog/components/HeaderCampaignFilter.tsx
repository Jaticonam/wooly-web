import "./HeaderCampaignFilter.css";

export interface HeaderCampaignOption {
  id: string;
  name: string;
  icon: string;
  colorClass: string;
  themeToken?: string;
}

interface HeaderCampaignFilterProps {
  campaigns: ReadonlyArray<HeaderCampaignOption>;
  active: string;
  counts?: Record<string, number>;
  show?: boolean;
  maxVisible?: number;
  onSelect: (id: string) => void;
}

export function HeaderCampaignFilter({
  campaigns,
  active,
  counts = {},
  show = true,
  maxVisible = 4,
  onSelect,
}: HeaderCampaignFilterProps) {
  const available = campaigns.filter(
    (campaign) => (counts[campaign.id] ?? 0) > 0,
  );

  const first = available.slice(0, Math.max(1, maxVisible));
  const activeCampaign = available.find((campaign) => campaign.id === active);

  const visibleCampaigns =
    activeCampaign && !first.some((campaign) => campaign.id === activeCampaign.id)
      ? [...first.slice(0, Math.max(0, maxVisible - 1)), activeCampaign]
      : first;

  if (!show || visibleCampaigns.length === 0) {
    return null;
  }

  return (
    <div className="header-campaign-filter" aria-label="Filtros de campaña">
      {visibleCampaigns.map((campaign) => {
        const isActive = active === campaign.id;

        return (
          <button
            key={campaign.id}
            type="button"
            onClick={() => onSelect(isActive ? "" : campaign.id)}
            className={`header-campaign-chip ${isActive ? "active" : ""}`}
            aria-pressed={isActive}
            title={campaign.name}
            data-theme-token={campaign.themeToken || undefined}
          >
            <span className="header-campaign-icon" aria-hidden="true">
              {campaign.icon}
            </span>

            <span className="header-campaign-name">{campaign.name}</span>
          </button>
        );
      })}
    </div>
  );
}
