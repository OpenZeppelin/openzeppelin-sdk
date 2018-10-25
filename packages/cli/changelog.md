# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## v2.0.0 - 2018-10-25

### Added

#### Commands

- **[major]** Command `push` now automatically discovers, pushes, and links any Solidity libraries used by the project contracts ([#208](https://github.com/zeppelinos/zos/issues/208))
- **[major]** Command `link` can now link multiple dependencies (formerly named `stdlib`) into a project ([#17](https://github.com/zeppelinos/zos/issues/17), [#39](https://github.com/zeppelinos/zos/issues/39), [#50](https://github.com/zeppelinos/zos/issues/50), [#99](https://github.com/zeppelinos/zos/issues/99), [#82](https://github.com/zeppelinos/zos/issues/82), [#125](https://github.com/zeppelinos/zos/issues/125)).
- **[major]** New `publish` command, that creates a set of `App`, `Package`, and `Directory` contracts for managing the project on-chain, allowing it to be used as a dependency by another project, and transfers upgradeability ownership of all proxies to the created `App` ([#257](https://github.com/zeppelinos/zos/issues/257))
- New `set-admin` command for changing the upgradeability admin of a proxy, allowing to implement upgradeability governance via more complex structures ([#47](https://github.com/zeppelinos/zos/issues/47))
- New `unlink` command for removing a previously linked dependency ([#49](https://github.com/zeppelinos/zos/issues/49))
- New `check` command for validating a contract for upgradeability errors (such as no `selfdestruct`, no default values for variables, and no `constructor`) ([#230](https://github.com/zeppelinos/zos/issues/230))
- New `--skip-compile` option in `push` command to skip automatic recompilation of contracts ([#214](https://github.com/zeppelinos/zos/issues/214))
- New `--publish` flag in `init`, that will cause the first `push` of a project to any network to automatically `publish` it as well ([#257](https://github.com/zeppelinos/zos/issues/257))

#### Validations

- Validate storage layout changes between subsequent `push` operations, to verify that changes in a contract will not corrupt storage when upgrading ([#117](https://github.com/zeppelinos/zos/issues/117))
- Validate that there are no initial values set in fields declarations, since these are not set when initializing a contract instance ([#241](https://github.com/zeppelinos/zos/issues/241))

#### Other

- Export `commands` and `scripts` functions, allowing the CLI commands to be used from javascript code ([#177](https://github.com/zeppelinos/zos/issues/177))


### Changed

- **[major]** Do not create `App`, `Package`, and `Directory` contracts by default, and use a `SimpleProject` model instead to create proxies and track logic contracts off-chain ([#146](https://github.com/zeppelinos/zos/issues/146), [#231](https://github.com/zeppelinos/zos/issues/231))
- Use canonical network names (`ropsten`, `mainnet`, etc; or `dev-NETWORK_ID` for development networks) for naming zos network files, instead of the custom identifier used for the truffle network connection name ([#213](https://github.com/zeppelinos/zos/issues/213))
- Enforce version check of `zosversion` to be equal to `2` in all json manifest files ([#162](https://github.com/zeppelinos/zos/pull/162))
- Contracts are now validated for errors when `push`ing them instead on `add`, to ensure that any changes performed after initially `add`ing them are also checked ([#224](https://github.com/zeppelinos/zos/issues/224))
- Rename `TestApp` to `TestHelper` ([#82](https://github.com/zeppelinos/zos/issues/82))
- Rename all references to stdlib or lib to dependency or EVM package ([#240](https://github.com/zeppelinos/zos/issues/240))

### Fixed

- Store `App`, `Package`, and `Directory` addresses in failed deployments, and resume from last deployed contract, instead of redeploying all of them from scratch ([#120](https://github.com/zeppelinos/zos/issues/120))
- Throw proper error message when trying to run a command with an undefined network ([#209](https://github.com/zeppelinos/zos/issues/209))
- Improve CLI output on errors, removing confusing _successful_ messages when not appropriate ([#229](https://github.com/zeppelinos/zos/issues/229))
- When creating a proxy from a dependency contract, use the version of the dependency for identifying the proxy in the network json file, instead of the version of the project ([#281](https://github.com/zeppelinos/zos/issues/281))

### Removed

- **[major]** Remove `--lib` flag when creating a new project via `init`, as any project can now be used as a dependency from another project, as long as it has been `publish`ed ([#253](https://github.com/zeppelinos/zos/issues/253))

## v1.4.3 - 2018-10-04

### Fixed

- Fix error when using `--from` flag with `truffle-hdwallet-provider` ([#98](https://github.com/zeppelinos/zos/issues/98))

### Changed

- Detect `zosversion` field in `zos.json` and `zos.network.json` files, and aborts execution if it's greater than `1`, to prevent working with `Package`s from version 2.0 using version 1.x of the CLI ([#163](https://github.com/zeppelinos/zos/pull/163))

## v1.4.2 - 2018-09-08

### Fixed

- Fix for `replacement transaction underpriced` and `nonce too low` errors when using `truffle-hdwallet-provider` in the CLI ([#63](https://github.com/zeppelinos/zos/pull/63))

## v1.4.1 - 2018-08-22

### Fixed

- CLI failed to exit process when using `HDWalletProvider` ([#20](https://github.com/zeppelinos/zos/issues/20))

## v1.4.0 - 2018-08-14

### Added
- New `verify` command to verify and publish a contract source code on etherchain ([#339](https://github.com/zeppelinos/zos-cli/pull/339))
- Add check for selfdestruct calls in logic contracts that could lead to orphaned proxies ([#347](https://github.com/zeppelinos/zos-cli/pull/347)) (thanks @hardlydifficult)

### Fixed
- Handle stdlib semver syntax in the `status` command ([#290](https://github.com/zeppelinos/zos-cli/issues/290))
- Better wording from status command when a contract is scheduled to be removed ([#304](https://github.com/zeppelinos/zos-cli/issues/304))
- Fail with an explicit error when attempting to create a proxy for an stdlib that was linked but not pushed to the network ([#322](https://github.com/zeppelinos/zos-cli/pull/322))
- Include default timeout in `--timeout` flag help ([#302](https://github.com/zeppelinos/zos-cli/issues/302))
- Fix naming issues of upgrade-command-related files ([#327](https://github.com/zeppelinos/zos-cli/pull/327))
- Modes `--fetch` and `--fix` from the `status` command now work properly with lib projects ([#314](https://github.com/zeppelinos/zos-cli/issues/314))

### Changed
- Swapped `TestApp` initializer parameters, it now accepts `txParams` first and an optional `ZosNetworkFile` object as a last argument.

## v1.1.0 - 2018-06-28

### Added
- New `session` command to pin a network, timeout, and sender address
- New `remove` command to remove a logic contract from a project
- Flag `--fetch` in `status` command retrieve app information directly from the network instead of from the local network file
- Flag `--fix` in `status` command to update the local network file with information retrieved from the network
- Models `ZosPackageFile` and `ZosNetworkFile` to manage zos JSON files 
- Write proxy address in contract build files on creation
- Add optional transaction `timeout` parameter to all commands
- Allow stdlib versions to be specified with npm range syntax
- Mechanism to ensure no more than one instance of CLI is running simultaneously
- Changelog file

### Changed
- Set testing environment in tests setup file
- Update zos-lib to version 1.3.0
- Update truffle to version 4.1.13
- Update truffle-core to version 4.1.13
- Update truffle-config to version 1.0.6
- Update truffle-workflow-compile to version 1.0.6
- Rename project param to project-name for init command
- Improve status command feedback using different logging colors

### Fixed
- Show error reason if loading truffle file fails
- Do not set stdlib to 0x0 if not necessary when pushing changes to the chain
- Print helper when zos is invoked without arguments
- Create empty `.gitkeep` files for Truffle folders initialization
- Handle error when stdlib network file is missing

### Removed
- Remove shelljs dependency
- Remove colors dependency
- Remove ethereumjs-abi dependency
