set -o errexit

TS_NODE_PROJECT="tsconfig.docs.json" node_modules/.bin/ts-node docs/bin/docs.ts
