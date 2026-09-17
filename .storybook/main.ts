import type { StorybookConfig } from '@storybook/vue3-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-onboarding',
    '@storybook/addon-themes',
  ],
  framework: '@storybook/vue3-vite',
  async viteFinal(viteConfig) {
    // vite-plugin-pwa (from the root vite.config.ts, which Storybook reuses)
    // tries to precache Storybook's own multi-MB JS bundles and fails the
    // build over Workbox's 2MB limit. It's an app-build concern only.
    const plugins = (viteConfig.plugins ?? [])
      .flat(Infinity)
      .filter(
        (plugin) => !(plugin && 'name' in plugin && plugin.name?.startsWith('vite-plugin-pwa'))
      );

    return { ...viteConfig, plugins };
  },
};

export default config;
