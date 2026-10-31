import type { Meta, StoryObj } from '@storybook/react-vite';
import { ListMusic, Music } from 'lucide-react';
import SegmentGroup from './SegmentGroup';

const meta = {
  title: 'Core/SegmentGroup',
  component: SegmentGroup,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  args: {
    'aria-label': 'Zobrazit',
    defaultValue: 'songs',
    options: [
      { value: 'songs', label: 'Písně' },
      { value: 'playlists', label: 'Playlisty' },
    ],
  },
} satisfies Meta<typeof SegmentGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithIcons: Story = {
  args: {
    options: [
      { value: 'songs', label: 'Písně', icon: Music },
      { value: 'playlists', label: 'Playlisty', icon: ListMusic },
    ],
  },
};

export const ThreeOptions: Story = {
  args: {
    label: 'Motiv',
    defaultValue: 'dark',
    options: [
      { value: 'dark', label: 'Tmavý' },
      { value: 'light', label: 'Světlý' },
      { value: 'system', label: 'Systém' },
    ],
  },
};

export const WithDisabledOption: Story = {
  args: {
    options: [
      { value: 'songs', label: 'Písně' },
      { value: 'playlists', label: 'Playlisty', disabled: true },
    ],
  },
};

export const Disabled: Story = {
  args: { disabled: true },
};
