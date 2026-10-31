import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { SongTextEditor } from './SongTextEditor';

const SONG = [
  '[intro]',
  '[G]  [D]  [Em]  [C]',
  '[verse]',
  '[G]Lorem ipsum [D]dolor sit,',
  '[Em]amet conse[C]ctetur.',
  '[chorus]',
  '[C]Ut enim [D]ad minim,',
  '[G]veniam [Em]quis.',
].join('\n');

function StatefulEditor({ initialText }: Readonly<{ initialText: string }>) {
  const [text, setText] = useState(initialText);
  return (
    <div style={{ maxWidth: 720 }}>
      <SongTextEditor
        text={text}
        onChange={setText}
      />
    </div>
  );
}

const meta = {
  title: 'Song/SongTextEditor',
  component: StatefulEditor,
  args: { initialText: SONG },
} satisfies Meta<typeof StatefulEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithChords: Story = {};

export const NewSong: Story = {
  args: { initialText: '' },
};
