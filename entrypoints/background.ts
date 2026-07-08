import { seedDefaults } from '../src/lib/storage';

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') void seedDefaults();
  });
});
