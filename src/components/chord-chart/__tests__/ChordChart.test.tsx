import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { useTheme } from '../../../hooks/useTheme';
import ChordChart from '../ChordChart';

const svguitar = vi.hoisted(() => {
  const chart = {
    configure: vi.fn(),
    chord: vi.fn(),
    draw: vi.fn(),
    remove: vi.fn(),
  };
  chart.configure.mockReturnValue(chart);
  chart.chord.mockReturnValue(chart);

  return {
    chart,
    SVGuitarChord: vi.fn(function SVGuitarChord() {
      return chart;
    }),
  };
});

vi.mock('svguitar', () => ({
  ChordStyle: { handdrawn: 'handdrawn' },
  SVGuitarChord: svguitar.SVGuitarChord,
}));

describe('ChordChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTheme.setState({ preferredInstrument: 'guitar' });
  });

  it('draws the chord diagram for the preferred instrument', () => {
    render(<ChordChart chord="Am" />);

    expect(screen.getByText('Am')).toHaveClass('name');
    expect(screen.getByRole('img', { name: 'Diagram akordu Am' })).toHaveClass('canvas');
    expect(svguitar.chart.configure).toHaveBeenCalledWith(
      // CSS paints it, so it picks up the brand color and follows theme changes.
      expect.objectContaining({ strings: 6, color: 'currentColor' })
    );
    expect(svguitar.chart.chord).toHaveBeenCalledWith(
      expect.objectContaining({ fingers: expect.any(Array) as unknown })
    );
    expect(svguitar.chart.draw).toHaveBeenCalledOnce();
  });

  it('redraws when the instrument changes', () => {
    render(<ChordChart chord="C" />);

    act(() => useTheme.setState({ preferredInstrument: 'ukulele' }));

    expect(svguitar.chart.remove).toHaveBeenCalledOnce();
    expect(svguitar.chart.configure).toHaveBeenLastCalledWith(
      expect.objectContaining({ strings: 4 })
    );
  });

  it('says when there is no diagram for the chord', () => {
    render(<ChordChart chord="Xyz" />);

    expect(screen.getByText('Diagram není k dispozici')).toHaveClass('missing');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(svguitar.SVGuitarChord).not.toHaveBeenCalled();
  });
});
