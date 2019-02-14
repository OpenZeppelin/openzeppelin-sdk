set -o errexit

TS_NODE_PROJECT="tsconfig.docs.json" node_modules/ts-node/dist/bin.js docs/bin/docs.ts
