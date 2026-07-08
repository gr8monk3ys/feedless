import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import App from '../entrypoints/popup/App';
import { getSettings } from '../src/lib/storage';

describe('popup', () => {
  beforeEach(() => fakeBrowser.reset());

  it('renders Instagram toggles grouped, with defaults checked', async () => {
    render(<App />);
    expect(await screen.findByText('Hide home feed')).toBeTruthy();
    expect(screen.getByText('Feeds & endless scroll')).toBeTruthy();
    const feed = screen.getByRole('checkbox', { name: 'Hide home feed' });
    expect((feed as HTMLInputElement).checked).toBe(true);
    const comments = screen.getByRole('checkbox', { name: 'Hide comments' });
    expect((comments as HTMLInputElement).checked).toBe(false);
  });

  it('toggling writes to storage', async () => {
    render(<App />);
    const feed = await screen.findByRole('checkbox', { name: 'Hide home feed' });
    fireEvent.click(feed);
    await waitFor(async () => {
      expect((await getSettings()).features['ig.feed']).toBe(false);
    });
  });

  it('switches platforms via tabs', async () => {
    render(<App />);
    await screen.findByText('Hide home feed');
    fireEvent.click(screen.getByRole('tab', { name: 'Facebook' }));
    expect(await screen.findByText('Hide news feed')).toBeTruthy();
  });

  it('has a master pause switch', async () => {
    render(<App />);
    const master = await screen.findByRole('checkbox', {
      name: 'Enable on Instagram',
    });
    fireEvent.click(master);
    await waitFor(async () => {
      expect((await getSettings()).features['ig._enabled']).toBe(false);
    });
  });
});
