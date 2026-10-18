import type { Preview } from '@storybook/react-vite';
import { withThemeByDataAttribute } from '@storybook/addon-themes';
import { MemoryRouter } from 'react-router';
import '../src/styles/global.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    // Not the app router: that one has auth guards and lazy pages. Stories only need <Link> to resolve.
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
    // Matches useTheme()'s real mechanism: it toggles data-theme on <html>.
    withThemeByDataAttribute({
      themes: {
        light: 'light',
        dark: 'dark',
      },
      defaultTheme: 'light',
      attributeName: 'data-theme',
    }),
  ],
};

export default preview;
