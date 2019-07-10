# Renaming definitions

These changes need to be applied across:
- Package names and dependencies in `package.json` files
- All help and error messages in CLI and lib
- All files set up upon an init (including `.gitignore` contents)
- All files in zepkit boxes
- Source files
- READMEs, HACKING, and other md files in the repo
- All files in the documentation for the upcoming version

We need to define how we want to support the migration from old to new config files. Depending on this, we may not need to rename all mock packages in our tests.

## Package names

| Current | New |
|---|---|
| zos | @openzeppelin/cli |
| zos-lib | @openzeppelin/upgrades |
| zos-docs | @openzeppelin/sdk-docs |

## Internal folder names

| Current | New |
|---|---|
| packages/cli | packages/cli |
| packages/lib | packages/lib |

## Commands

| Current | New |
|---|---|
| **zos** init MyProject | **openzeppelin** init MyProject |

Support **oz** as an alias, and **zos** as deprecated.

## Configuration files

| Current | New |
|---|---|
| zos.json | .openzeppelin/project.json |
| zos.rinkeby.json | .openzeppelin/rinkeby.json |
| .zos.lock | .openzeppelin/.lock |
| .zos.session | .openzeppelin/.session |

## Configuration keys

| Current | New |
|---|---|
| zosversion | manifestVersion |

## Module names

| Current | New |
|---|---|
| ZosPackageFile | ProjectFile |
| ZosNetworkFile | NetworkFile |
| ZosVersion | ManifestVersion |
| ZOSLibOwnable | OpenZeppelinUpgradesOwnable |
| ZOSLibECDSA | OpenZeppelinUpgradesECDSA |
| ZOSLibAddress | OpenZeppelinUpgradesAddress |
