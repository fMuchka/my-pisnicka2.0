import fs from 'node:fs';
import path from 'node:path';
import { generateTokensCss, TOKENS_CSS_FILE } from '../generateTokensCss';
import { CSS_TOKEN_SCOPES, CSS_TOKENS } from '../tokens';

const VAR_REFERENCE = /var\(\s*--([\w-]+)/g;
const DECLARATION = /^\s*--([\w-]+)\s*:/gm;

// Pre-existing references to tokens that were never defined. Fix the stylesheet, then drop the entry.
const KNOWN_UNDECLARED = new Set([
  'bg-tertiary',
  'color-error',
  'color-error-dark',
  'color-error-light',
  'radius-sm',
  'text-secondary',
]);

// Set inline by Ark UI at runtime, e.g. the Tabs indicator's position and size.
const ARK_RUNTIME_VARS = new Set(['left', 'top', 'width', 'height']);

// Read by Ark UI's inline styles, so a stylesheet may set them, e.g. the Tabs indicator transition.
const ARK_INPUT_VARS = new Set(['transition-duration', 'transition-timing-function']);

const tokenNames = new Set(Object.keys(CSS_TOKENS));
const generatedFile = path.resolve(TOKENS_CSS_FILE);

const stylesheets = fs
  .readdirSync('src', { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.css'))
  .map((entry) => path.join(entry.parentPath, entry.name))
  .filter((file) => path.resolve(file) !== generatedFile);

const unknownReferences = (text: string) =>
  [...text.matchAll(VAR_REFERENCE)]
    .map((match) => match[1]!)
    .filter(
      (name) => !tokenNames.has(name) && !KNOWN_UNDECLARED.has(name) && !ARK_RUNTIME_VARS.has(name)
    );

describe('CSS tokens', () => {
  it('tokens.generated.css is up to date', () => {
    const onDisk = fs.readFileSync(generatedFile, 'utf8').replaceAll('\r\n', '\n');
    expect(onDisk).toBe(generateTokensCss());
  });

  it('token values only reference declared tokens', () => {
    const values = [
      ...Object.values(CSS_TOKENS).flatMap((value) => {
        if (value === null) {
          return [];
        }
        return typeof value === 'string' ? [value] : [value.light, value.dark];
      }),
      ...CSS_TOKEN_SCOPES.flatMap(({ values }) => Object.values(values)),
    ];
    expect(values.flatMap(unknownReferences)).toEqual([]);
  });

  it.each(stylesheets)('%s only references declared tokens', (file) => {
    expect(unknownReferences(fs.readFileSync(file, 'utf8'))).toEqual([]);
  });

  it.each(stylesheets)('%s does not declare tokens outside tokens.ts', (file) => {
    const declared = [...fs.readFileSync(file, 'utf8').matchAll(DECLARATION)]
      .map((m) => m[1]!)
      .filter((name) => !ARK_INPUT_VARS.has(name));
    expect(declared).toEqual([]);
  });
});
