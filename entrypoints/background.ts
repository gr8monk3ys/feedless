import { getSettings, isEnabled, seedDefaults, setFeature } from '../src/lib/storage';
import { MASTER } from '../src/features/index';
import { platformForUrl } from '../src/lib/shortcut';

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') void seedDefaults();
  });

  // Post-uninstall feedback page (opened by the browser, not by us —
  // the extension itself never makes network requests).
  void browser.runtime.setUninstallURL(
    'https://github.com/gr8monk3ys/feedless/issues/new?template=feedback.yml&title=Uninstall%20feedback',
  );

  browser.commands.onCommand.addListener(async (command) => {
    if (command !== 'toggle-site') return;
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    const platform = platformForUrl(tab?.url);
    if (!platform) return;
    const s = await getSettings();
    await setFeature(MASTER[platform], !isEnabled(s, MASTER[platform]));
  });
});
