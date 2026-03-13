export type DashboardMode = "aggregate" | "realtime";

export type DashboardOverview = {
  totalVisits: number;
  appleStoreClicks: number;
  playStoreClicks: number;
  conversionRate: number;
  totalLinks: number;
  totalInfluencers: number;
  totalCampaigns: number;
  lastUpdatedAt: string | null;
};

export type DashboardSeriesPoint = {
  date: string;
  visits: number;
  appleStoreClicks: number;
  playStoreClicks: number;
};

export type DashboardLinkRow = {
  id: string;
  slug: string;
  name: string;
  publicUrl: string;
  source: string;
  campaign: string | null;
  influencer: string | null;
  totalVisits: number;
  appleStoreClicks: number;
  playStoreClicks: number;
  conversionRate: number;
};

export type DashboardGroupRow = {
  name: string;
  totalVisits: number;
  appleStoreClicks: number;
  playStoreClicks: number;
  conversionRate: number;
};

export type UtmDashboardData = {
  mode: DashboardMode;
  rangeDays: number;
  overview: DashboardOverview;
  series: DashboardSeriesPoint[];
  topLinks: DashboardLinkRow[];
  topInfluencers: DashboardGroupRow[];
  topCampaigns: DashboardGroupRow[];
  topSources: DashboardGroupRow[];
};
