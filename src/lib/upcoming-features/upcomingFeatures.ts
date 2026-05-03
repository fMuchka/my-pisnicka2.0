import upcomingFeaturesData from './data.json';

export type UpcomingFeature = {
  text: string;
};

const upcomingFeatures = (upcomingFeaturesData as string[]).map((text) => ({ text }));

export function getUpcomingFeatures(): UpcomingFeature[] {
  return upcomingFeatures;
}
