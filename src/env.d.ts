// Bundlers replace `process.env.NODE_ENV` at build time; declared here so the
// library doesn't depend on @types/node.
declare const process: { env: { NODE_ENV?: string } };
