// app/r/cards/testCssModules.ts
//
// TEST-ONLY. Lets the tsx test scripts import components that import CSS
// modules. Node has no loader for `.css`, so this registers one that returns
// a module whose every property is its own name (`styles.card === "card"`).
// Next never loads this file; import it FIRST in a test, before any
// component, so the hook exists when the component's `require` runs.

import Module from "node:module";

type CssLoader = (module: { exports: unknown }, filename: string) => void;

const extensions = (Module as unknown as { _extensions: Record<string, CssLoader> })._extensions;

extensions[".css"] = (module) => {
  module.exports = new Proxy(
    {},
    {
      get: (_target, key) => (key === "__esModule" ? false : typeof key === "string" ? key : undefined),
    },
  );
};
