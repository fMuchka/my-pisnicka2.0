import { setup, type Preview } from '@storybook/vue3-vite';
import { withThemeByDataAttribute } from '@storybook/addon-themes';
import { createMemoryHistory, createRouter } from 'vue-router';
import '../src/styles/global.css';

// Not the app router: that one has auth guards and lazy pages. Stories only need RouterLink to resolve.
setup((app) => {
  app.use(
    createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/:pathMatch(.*)*', component: { render: () => null } }],
    })
  );
});

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
