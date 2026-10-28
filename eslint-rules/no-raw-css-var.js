const VAR_REFERENCE = /var\(\s*--([\w-]+)/;
const BARE_NAME = /^--([\w-]+)$/;

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require CSS custom properties to be referenced through cssVar()/cssVarName() from src/styles/tokens.ts, so they are type-checked',
    },
    schema: [],
    messages: {
      rawVar: "Use cssVar('{{name}}') from src/styles/tokens.ts instead of a raw var(--{{name}}).",
      rawName:
        "Use cssVarName('{{name}}') from src/styles/tokens.ts instead of a raw '--{{name}}'.",
    },
  },

  create(context) {
    const checkText = (node, text) => {
      const bare = BARE_NAME.exec(text);
      if (bare) {
        context.report({ node, messageId: 'rawName', data: { name: bare[1] } });
        return;
      }
      const reference = VAR_REFERENCE.exec(text);
      if (reference) {
        context.report({ node, messageId: 'rawVar', data: { name: reference[1] } });
      }
    };

    return {
      Literal(node) {
        if (typeof node.value === 'string') {
          checkText(node, node.value);
        }
      },
      TemplateElement(node) {
        checkText(node, node.value.cooked ?? node.value.raw);
      },
    };
  },
};
