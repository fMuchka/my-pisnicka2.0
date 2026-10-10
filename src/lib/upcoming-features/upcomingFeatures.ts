import upcomingFeaturesData from './data.json';

export type FeatureArea = 'relace' | 'pisne' | 'seznamy';

type RawFeature =
  | string
  | { title: string; area?: FeatureArea; details?: string; status?: 'doing' };

export type UpcomingFeature = {
  title: string;
  area: FeatureArea | null;
  details: string | null;
  inProgress: boolean;
};

export type UpcomingFeatureGroup = {
  area: FeatureArea | null;
  label: string;
  features: UpcomingFeature[];
};

const FEATURE_AREAS: { area: FeatureArea; label: string }[] = [
  { area: 'relace', label: 'Relace' },
  { area: 'pisne', label: 'Písně' },
  { area: 'seznamy', label: 'Seznamy' },
];

function normalizeFeature(feature: RawFeature): UpcomingFeature {
  if (typeof feature === 'string') {
    return { title: feature, area: null, details: null, inProgress: false };
  }

  return {
    title: feature.title,
    area: feature.area ?? null,
    details: feature.details ?? null,
    inProgress: feature.status === 'doing',
  };
}

const upcomingFeatures = (upcomingFeaturesData as RawFeature[]).map(normalizeFeature);

export function getUpcomingFeatures(): UpcomingFeature[] {
  return upcomingFeatures;
}

export function groupFeaturesByArea(
  features: UpcomingFeature[] = upcomingFeatures
): UpcomingFeatureGroup[] {
  const groups: UpcomingFeatureGroup[] = FEATURE_AREAS.map(({ area, label }) => ({
    area,
    label,
    features: features.filter((feature) => feature.area === area),
  }));
  groups.push({
    area: null,
    label: 'Ostatní',
    features: features.filter((feature) => feature.area == null),
  });

  return groups.filter((group) => group.features.length > 0);
}
