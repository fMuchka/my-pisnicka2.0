import { UserLock, Globe, Music, ListMusic } from 'lucide-react';
import type { SegmentOption } from '../../components/_core/segment-group/types';

export const publicModeOptions: SegmentOption[] = [
  { label: 'Moje', value: 'private', icon: UserLock },
  { label: 'Veřejné', value: 'public', icon: Globe },
];

export const tabOptions: SegmentOption[] = [
  { label: 'Písně', value: 'songs', icon: Music },
  { label: 'Playlisty', value: 'playlists', icon: ListMusic },
];
