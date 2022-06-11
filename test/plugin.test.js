const postcss = require("postcss");
const { test } = require("uvu");
const assert = require("uvu/assert");
const plugin = require("../src/plugin");

async function run(
  input,
  output,
  opts = { token: process.env.FIGMATIK_TOKEN }
) {
  let style = await import("figmatik/lib/plugin/style.js").then((d) =>
    d.default({ unit: "pixel" })
  );
  opts.plugins = [style];
  let result = await postcss([plugin(opts)]).process(input, {
    from: undefined,
  });
  assert.is(result.css.replace(/\s/gim, ""), output.replace(/\s/gim, ""));
  // assert.is(result.warnings().length, 0);
}

test("@file figma url", async () => {
  const input = `@file https://www.figma.com/file/KObTiYNzH7zah3VSknbeki/content-test;`;
  const output = ``;
  await run(input, output);
});

test("@file figma url with version", async () => {
  const input = `@file https://www.figma.com/file/KObTiYNzH7zah3VSknbeki/content-test?version-id=1875943475`;
  const output = ``;
  await run(input, output);
});

test("@file id", async () => {
  const input = `@file ZsaaakKEgys8zPMBaUbFz3 {}`;
  const output = ``;
  await run(input, output);
});

test("@file id and version", async () => {
  const input = `@file KObTiYNzH7zah3VSknbeki 1875943475 {}`;
  const output = ``;
  await run(input, output);
});

test("@select just value", async () => {
  const input = `@file ZsaaakKEgys8zPMBaUbFz3 { @select [@name="Configuration=filled, Icon=with-icon, State=hovered"] { button { border-radius: $borderRadius } } }`;
  const output = `button { border-radius: 100px }`;
  await run(input, output);
});

test("@select nested just value", async () => {
  const input = `@file ZsaaakKEgys8zPMBaUbFz3 { @select button.component-set [configuration=filled][icon=with-icon] { button { border-radius: $borderRadius } } }`;
  const output = `button { border-radius: 100px }`;
  await run(input, output);
});

test("value in var", async () => {
  const input = `@file ZsaaakKEgys8zPMBaUbFz3 { @select button.component-set [configuration=filled][icon=with-icon] { button { border-radius: var(--button-border-radius, $borderRadius) } } }`;
  const output = `button { border-radius: var(--button-border-radius, 100px) }`;
  await run(input, output);
});

test("values", async () => {
  const input = `@file ZsaaakKEgys8zPMBaUbFz3 { @select button.component-set [configuration=filled][icon=with-icon] { button { padding: $paddingTop $paddingRight $paddingBottom $paddingLeft } } }`;
  const output = `button { padding: 10px 24px 10px 16px }`;
  await run(input, output);
});

test("values empty (node not found)", async () => {
  const input = `@file ZsaaakKEgys8zPMBaUbFz3 { @select button.component-set [configuration=text][icon=with-icon][state=hovered] state-layer { button { background-color: $backgroundColor } } }`;
  const output = ``;
  await run(input, output);
});

test("values empty (prop not found)", async () => {
  const input = `@file ZsaaakKEgys8zPMBaUbFz3 { @select button.component-set [configuration=text][icon=with-icon][state=hovered] .text { button { background-color: $backgroundColor } } }`;
  const output = `button{}`;
  await run(input, output);
});

test("@style text", async () => {
  const input = `@file ZsaaakKEgys8zPMBaUbFz3 { @select button.component-set [configuration=text][icon=with-icon][state=hovered] .text { button { @style text; } } }`;
  const output = `button{
    font-family:Roboto;
    font-size:14px;
    font-weight:500;
    letter-spacing:0.1px;
    line-height:20px;
    text-align:center;
    vertical-align:middle;
  }`;
  await run(input, output);
});

test.run();
