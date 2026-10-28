import { CSS_TOKEN_SCOPES, CSS_TOKENS } from './tokens';

export const TOKENS_CSS_FILE = 'src/styles/tokens.generated.css';

const declaration = ([name, value]: [string, string]) => `  --${name}: ${value};\n`;

const rule = (selector: string, declarations: [string, string][]) =>
  `${selector} {\n${declarations.map(declaration).join('')}}\n`;

export const generateTokensCss = () => {
  const light: [string, string][] = [];
  const dark: [string, string][] = [];

  for (const [name, value] of Object.entries(CSS_TOKENS)) {
    if (value === null) {
      continue;
    }
    if (typeof value === 'string') {
      light.push([name, value]);
    } else {
      light.push([name, value.light]);
      dark.push([name, value.dark]);
    }
  }

  return [
    '/* Generated from src/styles/tokens.ts by the css-tokens Vite plugin. Do not edit. */\n',
    rule(':root', light),
    rule("[data-theme='dark']", dark),
    ...CSS_TOKEN_SCOPES.map(({ selector, values }) =>
      rule(selector, Object.entries(values) as [string, string][])
    ),
  ].join('\n');
};
