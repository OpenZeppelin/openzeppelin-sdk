This monorepo is managed via [lerna](https://lernajs.io/). To get everything up
and running, install lerna 3.x (either globally or locally from the root of the
repository), and run `lerna bootstrap`. This will compile all packages, install
all dependencies, and create symlinks for local dependencies (for instance,
`packages/cli/node_modules/zos-lib` will be symlinked to `packages/lib`).

Note that, since `cli` and `lib` packages need to be precompiled, for any
change in `lib` to impact `cli` you'll need to run a new `lerna bootstrap`.
