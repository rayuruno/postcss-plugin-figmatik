const Figmatik = import("figmatik").then((m) => m.default);
const Util = import("figmatik/lib/util.js");
const { fileParams } = require("./params");
const last = (arr) => arr[arr.length - 1];

module.exports = (opts = {}) => {
  const styleMixins = {
    ...opts.styleMixins,
  };
  let figmatik;

  return {
    postcssPlugin: "postcss-plugin-figma",

    prepare() {
      const ctx = {
        files: [],
        getCurrentFile() {
          return last(this.files);
        },
        nodes: [],
        getCurrentNode() {
          return last(this.nodes);
        },
      };

      const processed = Symbol("processed");

      const select = (params) => {
        const root = ctx.getCurrentNode() || ctx.getCurrentFile()?.document;
        return root?.querySelector(params);
      };

      const applyStyle = async (props, atRule, Declaration) => {
        for (const prop of props) {
          atRule.append(
            new Declaration({
              prop: (await Util).kebabCase(prop),
              value: `$${prop}`,
            })
          );
        }
      };

      return {
        AtRule: {
          file: async (atRule, { result }) => {
            if (atRule[processed]) return;
            figmatik ||= (await Figmatik)(opts);

            const params = fileParams(atRule.params);
            const file = await figmatik.api.files(params);
            if (file) {
              ctx.files.push(file);
            } else {
              atRule.warn(result, "file not found");
            }
            if (!atRule.nodes) atRule.remove();
            atRule[processed] = true;
          },

          select: async (atRule, { result }) => {
            const node = select(atRule.params);
            if (node) {
              ctx.nodes.push(node);
            } else {
              atRule.warn(result, `node not found ${atRule.params}`);
              atRule.remove();
            }
            if (!atRule.nodes) atRule.remove();
          },

          style: async (atRule, { Declaration, result }) => {
            const props =
              styleMixins[atRule.params] ||
              (ctx.getCurrentNode()?.styles?.[atRule.params]
                ? Object.keys(ctx.getCurrentNode()?.styles?.[atRule.params])
                : null);
            if (props) {
              await applyStyle(props, atRule, Declaration);
            } else {
              atRule.warn(result, `style mixin found ${atRule.params}`);
            }
            if (!atRule.nodes) atRule.remove();
          },
        },
        AtRuleExit: {
          file: (atRule) => {
            ctx.files.pop();
            if (atRule.nodes) {
              atRule.replaceWith(atRule.nodes);
            }
          },

          select: (atRule) => {
            ctx.nodes.pop();
            if (atRule.nodes) {
              atRule.replaceWith(atRule.nodes);
            } else {
              atRule.remove();
            }
          },

          style: (atRule) => {
            if (atRule.nodes) {
              atRule.replaceWith(atRule.nodes);
            } else {
              atRule.remove();
            }
          },
        },
        Declaration: (decl, { result }) => {
          if (decl[processed]) return;
          decl[processed] = true;

          const vars = decl.value.match(/\$(\w+)/gim);
          if (!vars) return;

          const node = ctx.getCurrentNode();
          if (!node) {
            decl.warn(result, `node not set ${decl.toString()}`);
            decl.remove();
            return;
          }

          for (const v of vars) {
            const prop = v.toString().substring(1);
            const value = node.styleMap[prop];

            if (!value) {
              decl.warn(
                result,
                `value not found ${prop} ${node.name} ${node.type}`
              );
              decl.remove();
              return;
            } else {
              decl.value = decl.value.replaceAll(v, value);
            }
          }
          if (!decl.value) {
            decl.remove();
          }
        },
      };
    },
  };
};
