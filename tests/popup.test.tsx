import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import App from '../entrypoints/popup/App';
import { getSettings } from '../src/lib/storage';
import { setSnooze } from '../src/lib/storage';
import { recordDiagnosis } from '../src/lib/diagnosis';

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

describe('popup v0.2', () => {
  beforeEach(() => fakeBrowser.reset());

  it('snooze buttons write a future snooze and show the countdown row', async () => {
    render(<App />);
    fireEvent.click(await screen.findByRole('button', { name: '30m' }));
    await waitFor(async () => {
      const s = await getSettings();
      expect(s.snooze?.ig).toBeGreaterThan(Date.now() + 29 * 60_000);
    });
    expect(await screen.findByText(/resumes in/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /resume now/i }));
    await waitFor(async () => {
      expect((await getSettings()).snooze?.ig).toBeUndefined();
    });
  });

  it('intention input saves on change', async () => {
    render(<App />);
    const input = await screen.findByPlaceholderText(/why did you open/i);
    fireEvent.change(input, { target: { value: 'Check DMs only' } });
    fireEvent.blur(input);
    await waitFor(async () => {
      expect((await getSettings()).intention).toBe('Check DMs only');
    });
  });

  it('intention saves without a blur, which a dismissed popup may never fire', async () => {
    render(<App />);
    const input = await screen.findByPlaceholderText(/why did you open/i);
    fireEvent.change(input, { target: { value: 'Check DMs only' } });
    // Deliberately no blur: clicking outside tears the popup down, and the
    // blur handler is not guaranteed to run before the document goes away.
    await waitFor(async () => {
      expect((await getSettings()).intention).toBe('Check DMs only');
    });
  });

  it('collapses a typing burst into one write, staying inside the sync quota', async () => {
    render(<App />);
    const input = await screen.findByPlaceholderText(/why did you open/i);
    const writes = vi.spyOn(fakeBrowser.storage.sync, 'set');

    for (const value of ['C', 'Ch', 'Che', 'Chec', 'Check DMs only']) {
      fireEvent.change(input, { target: { value } });
    }

    await waitFor(async () => {
      expect((await getSettings()).intention).toBe('Check DMs only');
    });
    // chrome.storage.sync allows only 120 writes/minute; one write per
    // keystroke would exhaust it and Chrome would start rejecting saves.
    expect(writes.mock.calls.length).toBeLessThanOrEqual(2);
  });

  it('flags features suspect for 3+ days and shows the report banner', async () => {
    for (const day of ['2026-07-08', '2026-07-09', '2026-07-10']) {
      await recordDiagnosis({ suspects: ['ig.feed'], checked: ['ig.feed'] }, day);
    }
    render(<App />);
    expect(await screen.findByText(/may be broken/i)).toBeTruthy();
    expect(screen.getByTitle(/selector may be broken/i)).toBeTruthy();
  });
});
