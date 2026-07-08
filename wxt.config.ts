import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Feedless',
    description:
      'Hide distracting feeds, Reels, Stories, badges and more on Instagram and Facebook.',
    permissions: ['storage'],
  },
});
