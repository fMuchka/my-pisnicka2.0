import { describe, expect, it } from 'vitest';
import { matchSuggestions } from '../suggestions';

const tags = ['Táborák', 'Folk', 'Česká klasika', 'Pohádky', 'Rock'];

describe('matchSuggestions', () => {
  it('suggests nothing until something is typed', () => {
    expect(matchSuggestions(tags, '', [])).toEqual([]);
    expect(matchSuggestions(tags, '   ', [])).toEqual([]);
  });

  it('ignores case and accents', () => {
    expect(matchSuggestions(tags, 'tabo', [])).toEqual(['Táborák']);
    expect(matchSuggestions(tags, 'CESKA', [])).toEqual(['Česká klasika']);
  });

  it('puts the tags starting with the text first', () => {
    expect(matchSuggestions(['Rock', 'Krok', 'Kolo'], 'k', [])).toEqual(['Krok', 'Kolo', 'Rock']);
  });

  it('leaves out tags already picked, whatever their case', () => {
    expect(matchSuggestions(tags, 'o', ['folk', 'ROCK'])).toEqual(['Táborák', 'Pohádky']);
  });

  it('stops at the limit', () => {
    expect(matchSuggestions(tags, 'a', [], 2)).toHaveLength(2);
  });
});
