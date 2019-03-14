# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## v2.2.2 - 2019-03-14

### Added
- Added Goerli network to the list of known networks, both for verification on etherscan and for naming of zos.network.json files ([#768](https://github.com/zeppelinos/zos/pull/768)) (thanks @paulinablaszk!)

### Fixed
- Fix contracts compilation on Windows workstations ([#764](https://github.com/zeppelinos/zos/pull/764)) (thanks @siromivel!)
- Avoid adding libraries and contracts from external packages ([#758](https://github.com/zeppelinos/zos/pull/758)) (thanks @siromivel!)
- Fix ZWeb3 initialization when providing an HTTP url as a web3 provider ([#785](https://github.com/zeppelinos/zos/issues/785))

### Changed
- Exceptions thrown during the validation process can be ignored during `zos push` via the `--force` flag ([#770](https://github.com/zeppelinos/zos/pull/770))


## v2.2.1 - 2019-02-26

### Fixed
- Provider initialization issue on `zos check` command ([#737](https://github.com/zeppelinos/zos/pull/737))
- Error messages that refer to `truffle.js` config file when actually it is `truffle-config.js` ([#710](https://github.com/zeppelinos/zos/pull/710))
- Error message "Cannot read zosversion of undefined" when attempting to create a contract on a new network that had not been `push`'ed to before ([#711](https://github.com/zeppelinos/zos/pull/711))
- Handle spaces in project path when compiling contracts ([#743](https://github.com/zeppelinos/zos/pull/743))

## v2.2.0 - 2019-02-14

### Added
- Contributing guidelines ([#553](https://github.com/zeppelinos/zos/pull/553))
- Example using truffle migrations ([#416](https://github.com/zeppelinos/zos/pull/416))
- Tests for `verify` command ([#468](https://github.com/zeppelinos/zos/pull/468))
- Migration process for projects using previous versions of ZeppelinOS v2 ([#621](https://github.com/zeppelinos/zos/pull/621))
- Support receiving booleans via the CLI ([#623](https://github.com/zeppelinos/zos/pull/623))
- Parse scientific notation numbers from the CLI ([#567](https://github.com/zeppelinos/zos/pull/567))
- Linter pre-commit githook ([#620](https://github.com/zeppelinos/zos/pull/620))

### Changed
- **Update Web3 to version `1.0.0-beta.37`** ([#572](https://github.com/zeppelinos/zos/pull/572))
- Migrate `cli` codebase to TypeScript ([#494](https://github.com/zeppelinos/zos/pull/494), [#516](https://github.com/zeppelinos/zos/pull/516), [#517](https://github.com/zeppelinos/zos/pull/517), [#523](https://github.com/zeppelinos/zos/pull/523), [#515](https://github.com/zeppelinos/zos/pull/515), [#521](https://github.com/zeppelinos/zos/pull/521), [#525](https://github.com/zeppelinos/zos/pull/525), [#526](https://github.com/zeppelinos/zos/pull/526), [#529](https://github.com/zeppelinos/zos/pull/529), [#530](https://github.com/zeppelinos/zos/pull/530), [#531](https://github.com/zeppelinos/zos/pull/531), [#532](https://github.com/zeppelinos/zos/pull/532), [#537](https://github.com/zeppelinos/zos/pull/537))
- Add `lodash` functions separately ([#555](https://github.com/zeppelinos/zos/pull/555)) (thanks @slorenzo!)
- Update Etherscan api key url ([#474](https://github.com/zeppelinos/zos/pull/474))
- Polish `Truffle` util methods used in CLI ([#507](https://github.com/zeppelinos/zos/pull/507))
- Avoid transferring proxies to `App` on publish ([#609](https://github.com/zeppelinos/zos/pull/609))

### Fixed
- Force compiling all contracts ([#581](https://github.com/zeppelinos/zos/pull/581))
- Etherscan mainnet url ([#642](https://github.com/zeppelinos/zos/pull/642))
- Checksum default sender address on initialization ([#654](https://github.com/zeppelinos/zos/pull/654))
- Ignore Truffle's default gas value ([#671](https://github.com/zeppelinos/zos/pull/671))
- Integration tests using `truffle-hdwallet-provider` ([#473](https://github.com/zeppelinos/zos/pull/473))

### Removed
- `truffle-contracts` from codebase ([#451](https://github.com/zeppelinos/zos/pull/451))
- `truffle-resolver` from CLI and honor `from` in config ([#612](https://github.com/zeppelinos/zos/pull/612))
- Lightweight terminology ([#550](https://github.com/zeppelinos/zos/pull/550))

## v2.1.2 - 2019-02-01

### Fixed
- Use patched versions of `web3@0.18` ([#9571fd4](https://github.com/zeppelinos/zos/commit/9571fd425647c093ee856784acab0055c7556992))
- Use patched versions of `ethereumjs-abi@0.6` ([#9571fd4](https://github.com/zeppelinos/zos/commit/9571fd425647c093ee856784acab0055c7556992))
- Use pinned version `1.2.8` of `truffle-flattener` ([#9571fd4](https://github.com/zeppelinos/zos/commit/9571fd425647c093ee856784acab0055c7556992))

## v2.1.1 - 2019-01-31

### Added
- Support compiling with globally installed truffle ([#596](https://github.com/zeppelinos/zos/pull/596))

## v2.1.0 - 2019-01-10

### Added
- Support Truffle 5 projects ([04137b7](https://github.com/zeppelinos/zos/commit/04137b75595fcb2c97972f60b465a778bfa216a7))
- Etherscan integration for contracts verification ([#413](https://github.com/zeppelinos/zos/pull/413)) (thanks @ProtonGustave!)
- More tests to `create` command in CLI ([9a935a3](https://github.com/zeppelinos/zos/commit/9a935a3045dec98fe335bae3fdb28f04189efe8a))

### Changed
- Remove `truffle-workflow-compile` in favor of shell compilation ([423d8f9](https://github.com/zeppelinos/zos/commit/423d8f952c98431e6eb1124d47205952f4cc4017))
- Delete mock contracts when publishing package ([#293](https://github.com/zeppelinos/zos/pull/293))

### Fixed
- Avoid deleting deployment info from other networks in truffle artifacts ([#415](https://github.com/zeppelinos/zos/pull/415))
- Remove legacy code from `app` and `lib` distinction ([#449](https://github.com/zeppelinos/zos/pull/449))
- Remove `sinon` as a main dependency ([1c64175](https://github.com/zeppelinos/zos/commit/1c641756261f5f8fe3c940bbf3db236da9daef47))

## v2.0.2 - 2018-12-19

### Added
- `truffle-provider` dependency to make sure we rely on `web3@^0.x` ([38867fd](https://github.com/zeppelinos/zos/commit/38867fdd0e18c6d4bf869c11a1c94f796c8185e0))

### Fixed
- Pin truffle dependencies versions ([38867fd](https://github.com/zeppelinos/zos/commit/38867fdd0e18c6d4bf869c11a1c94f796c8185e0))
- Promise resolution in `runWithTruffle` function ([6e4258c](https://github.com/zeppelinos/zos/commit/6e4258c5378afb643454154fd2cf22f93a4d0020))

## v2.0.1 - 2018-10-26

### Changed

- Improve validation messages for security verifications (such as storage layout checks, no-constructor checks, or fields with initial values in their declaration) ([#362](https://github.com/zeppelinos/zos/issues/362)).
- Add default gas price of 5 gwei to `truffle.js` template file created on `zos init` ([#354](https://github.com/zeppelinos/zos/issues/354)).

### Fixed

- Fix `Web3ProviderEngine does not support synchronous requests` error when running `zos status --fix` with an async web3 provider ([#388](https://github.com/zeppelinos/zos/issues/388)).
- Throw a meaningful error when attempting to push a project with a link to an unpublished dependency ([#356](https://github.com/zeppelinos/zos/issues/356)).

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
