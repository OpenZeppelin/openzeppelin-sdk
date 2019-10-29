This monorepo is managed via [Yarn workspaces](https://yarnpkg.com/lang/en/docs/workspaces/).

To get everything up and running, install Yarn and run `yarn` in the repository root.
This will compile all packages, install all dependencies, and create symlinks for local
dependencies (for instance, `packages/cli/node_modules/@openzeppelin/upgrades` will be
symlinked to `packages/lib`).

Note that, since `cli` and `lib` packages need to be precompiled, for any change in `lib`
to impact `cli` you'll need to run `yarn` in the `lib` directory.
