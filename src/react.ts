import * as ReactNamespace from "react";

// Node's native ESM loader can't detect React 16's named exports (they are
// assigned dynamically in CommonJS), so `import { useState } from "react"`
// fails there. The default export is always the complete module object.
const React: typeof ReactNamespace =
    (ReactNamespace as { default?: typeof ReactNamespace }).default ??
    ReactNamespace;

export default React;
