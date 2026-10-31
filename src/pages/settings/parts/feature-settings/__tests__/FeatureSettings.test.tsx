import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  DEFAULT_FEATURE_PREFERENCES,
  useFeaturePreferences,
} from '../../../../../stores/featurePreferences';
import { FeatureSettings } from '../FeatureSettings';

const switches = [
  ['Zobrazovat zbývající čas', 'timeLeftVisible'],
  ['Pozastavit klepnutím na text', 'tapToToggleScroll'],
  ['Nezhasínat obrazovku', 'keepScreenAwake'],
  ['Ruční posouvání během hraní', 'allowManualScroll'],
] as const;

describe('FeatureSettings', () => {
  beforeEach(() => {
    localStorage.clear();
    useFeaturePreferences.setState(DEFAULT_FEATURE_PREFERENCES);
  });

  it('lists every feature with a line on what it does', () => {
    render(<FeatureSettings />);

    expect(screen.getByRole('heading', { name: 'Režim hraní' })).toBeInTheDocument();
    for (const [label] of switches) {
      expect(screen.getByRole('switch', { name: new RegExp(label) })).toBeChecked();
    }
    expect(screen.getByText(/klepnutí kamkoli na text písně/i)).toBeInTheDocument();
  });

  it.each(switches)('turns "%s" off and on', async (label, key) => {
    const user = userEvent.setup();
    render(<FeatureSettings />);
    const toggle = screen.getByRole('switch', { name: new RegExp(label) });

    await user.click(toggle);
    expect(useFeaturePreferences.getState()[key]).toBe(false);
    expect(toggle).not.toBeChecked();

    await user.click(toggle);
    expect(useFeaturePreferences.getState()[key]).toBe(true);
  });

  it('reflects a preference changed elsewhere', () => {
    useFeaturePreferences.setState({ timeLeftVisible: false });
    render(<FeatureSettings />);

    expect(screen.getByRole('switch', { name: /zobrazovat zbývající čas/i })).not.toBeChecked();
  });
});
