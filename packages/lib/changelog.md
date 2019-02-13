# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## Next

### Added
- Contributing guidelines ([#553](https://github.com/zeppelinos/zos/pull/553))
- **New `ProxyAdmin` contract to manage proxy instances** ([#588](https://github.com/zeppelinos/zos/pull/588) and [#625](https://github.com/zeppelinos/zos/pull/625)) (see [audit report](https://medium.com/nomic-labs-blog/zeppelinos-audit-report-iii-602714cb92d4))
- Linter pre-commit githook ([#620](https://github.com/zeppelinos/zos/pull/620))

### Changed
- **Update Web3 to version `1.0.0-beta.37`** ([#572](https://github.com/zeppelinos/zos/pull/572))
- Use web3 compatible contract classes ([#595](https://github.com/zeppelinos/zos/pull/595))
- Migrate `lib` codebase to TypeScript ([#443](https://github.com/zeppelinos/zos/pull/443), [#492](https://github.com/zeppelinos/zos/pull/492), [#493](https://github.com/zeppelinos/zos/pull/493), [#491](https://github.com/zeppelinos/zos/pull/491), [#500](https://github.com/zeppelinos/zos/pull/500), and [#509](https://github.com/zeppelinos/zos/pull/509))
- Add `lodash` functions separately ([#555](https://github.com/zeppelinos/zos/pull/555)) (thanks @slorenzo!)
- Upgrade `truffle-flattener` to version `1.3.0` ([#682](https://github.com/zeppelinos/zos/pull/682))

### Fixed
- Gas estimation issues on geth ([#614](https://github.com/zeppelinos/zos/pull/614))
- Use gas defaults when present ([#575](https://github.com/zeppelinos/zos/pull/575))
- Bytecode comparison in `SimpleProject` ([#580](https://github.com/zeppelinos/zos/pull/580))
- Avoid changing tx params object for every transaction ([#675](https://github.com/zeppelinos/zos/pull/675))

### Removed
- `truffle-contracts` from codebase ([#451](https://github.com/zeppelinos/zos/pull/451))
- `truffle-resolver` from CLI and honor `from` in config ([#612](https://github.com/zeppelinos/zos/pull/612))

## v2.1.2 - 2019-02-01

### Fixed
- Use patched versions of `web3@0.18` ([#9571fd4](https://github.com/zeppelinos/zos/commit/9571fd425647c093ee856784acab0055c7556992))
- Use patched versions of `ethereumjs-abi@0.6` ([#9571fd4](https://github.com/zeppelinos/zos/commit/9571fd425647c093ee856784acab0055c7556992))
- Use pinned version `1.2.8` of `truffle-flattener` ([#9571fd4](https://github.com/zeppelinos/zos/commit/9571fd425647c093ee856784acab0055c7556992))

## v2.1.1 - 2019-01-31

### Fixed
- Storage layout check fixes ([#606](https://github.com/zeppelinos/zos/pull/606))

## v2.1.0 - 2019-01-10

### Added
- Extend [`Initializable`](https://github.com/zeppelinos/zos/blob/v2.1.0-rc.0/packages/lib/contracts/Initializable.sol) pragma to allow solidity 0.5 ([912bf2d](https://github.com/zeppelinos/zos/commit/912bf2dabb571716c40bb86e429153bda6ef3ad8))
- Gas price estimations on mainnet with ETH Gas Station ([#299](https://github.com/zeppelinos/zos/pull/299)) (thanks @zachzundel!)

### Changed
- Use contract method `estimateGas` function to estimate contract functions calls ([#310](https://github.com/zeppelinos/zos/pull/310))
- Delete mock contracts when publishing package ([#293](https://github.com/zeppelinos/zos/pull/293))

### Fixed
- Fix `encodeCall` address handling ([#569](https://github.com/zeppelinos/zos/pull/569))
- Fix ETH Gas Station integration request ([8515895](https://github.com/zeppelinos/zos/commit/8515895ed253409c5d782e8b7e17ab1a96126d0e))

## v2.0.2 - 2018-12-19

### Added
- `truffle-provider` dependency to make sure we rely on `web3@^0.x` ([38867fd](https://github.com/zeppelinos/zos/commit/38867fdd0e18c6d4bf869c11a1c94f796c8185e0))

### Fixed
- Pin truffle dependencies versions ([38867fd](https://github.com/zeppelinos/zos/commit/38867fdd0e18c6d4bf869c11a1c94f796c8185e0))
- Promise resolution in `runWithTruffle` function ([6e4258c](https://github.com/zeppelinos/zos/commit/6e4258c5378afb643454154fd2cf22f93a4d0020))

## v2.0.1 - 2018-10-26

### Changed

- Skip gas price checks if working on a local ganache instance ([#359](https://github.com/zeppelinos/zos/issues/359)).

### Fixed

- Fetch correct address when initializing a proxy that spawns a new proxy as part of its initialization ([#367](https://github.com/zeppelinos/zos/issues/367)).
- Properly handle scientific notation (such as `5e10`) in proxies initialization arguments on `encodeCall` function ([#355](https://github.com/zeppelinos/zos/issues/355)).

## v2.0.0 - 2018-10-25

### Added

- New `AppProject` model for managing a project based on an `App` contract directly from `zos-lib`, and simplify `App` contract model wrapper ([`beb7afdb`](https://github.com/zeppelinos/zos/commit/beb7afdb39e5bca9eab128662f7bdbecf255c9f7))
- New `SimpleProject` model for managing a project without depending on an `App`, `Package`, or `Directory` contract, tracking logic contracts entirely off-chain ([#83](https://github.com/zeppelinos/zos/issues/83), [#93](https://github.com/zeppelinos/zos/issues/93), [#137](https://github.com/zeppelinos/zos/issues/137), [#171](https://github.com/zeppelinos/zos/issues/171))
- Support creating non-upgradeable contract instances from deployed logic contracts ([zeppelinos/zos-lib#223](https://github.com/zeppelinos/zos-lib/issues/223))


### Changed

- **[major]** New contracts architecture and models for supporting multiple dependencies (formerly named `stdlib`) in a project. `App` contract holds references to multiple `Package`s (which are either dependencies or the project's main package), the reference to an `stdlib` is removed from the `Directory`, and creating a new proxy requires specifying the name of the package and the contract ([#17](https://github.com/zeppelinos/zos/issues/17)).

#### Contracts

- **[major]** Change `Initializable` base contract, simplifying `isInitializable(name,version)` modifier to `initializer()`, and removing `Migratable` ([#12](https://github.com/zeppelinos/zos/issues/12), [#167](https://github.com/zeppelinos/zos/issues/167), [#215](https://github.com/zeppelinos/zos/issues/215))
- Handle `Proxy` initialization atomically in its constructor ([#106](https://github.com/zeppelinos/zos/issues/106))
- Index event arguments in contracts to improve querying ([#193](https://github.com/zeppelinos/zos-lib/pull/193))
- Adapt `Package` public methods to a common interface shared with AragonOS, and enforce semver usage for identifying versions ([#140](https://github.com/zeppelinos/zos/issues/140))

#### Transactions

- Retry gas estimations upon failure, to handle scenarios where the previous mined transactions had not yet propagated ([#198](https://github.com/zeppelinos/zos/issues/198))
- Prefer the matching `initialize` method from the most derived contract when performing initialization method lookup in ABI, and accept fully-qualified function names such as `initialize(uint256)` ([#197](https://github.com/zeppelinos/zos/issues/197), [#234](https://github.com/zeppelinos/zos/issues/234))
- Refuse to run transactions with truffle default gas price (100GWei) to prevent accidental excessive gas costs on deployments ([#200](https://github.com/zeppelinos/zos/issues/200))

### Fixed

- Remove swarm hash from bytecode before hashing it, to prevent a contract from being detected as changed when compiled from different workstations ([#105](https://github.com/zeppelinos/zos/issues/105))
- Do not index newly created Proxy addresses in `ProxyCreated` app event ([#221](https://github.com/zeppelinos/zos/issues/221))
- Use `delegatecall` for running `upgradeToAndCall` operation in `Proxy` more efficiently ([#219](https://github.com/zeppelinos/zos/issues/219))
- Fix import error when importing `zos-lib` without having a global web3 instance set ([`79f57336`](https://github.com/zeppelinos/zos/commit/79f57336b70dfd35365feb1b7ce91415cf9fcbe7))

### Removed

- **[major]** Remove `Migratable` contract in favour of new simplified `Initializable` contract ([#220](https://github.com/zeppelinos/zos/issues/220))
- Remove `UnversionedApp` contract, merging `BaseApp` with `VersionedApp` into `App` ([#110](https://github.com/zeppelinos/zos/issues/110)) 
- Remove `FreezableImplementationDirectory` contract, and add freezable feature to `ImplementationDirectory` by default ([#110](https://github.com/zeppelinos/zos/issues/110))
- Remove `Release` contract, in favour of `ImplementationDirectory` ([#168](https://github.com/zeppelinos/zos-lib/pull/168))

## v1.4.1 - 2018-08-22

### Fixed
- Fix critical error when running `push` with an `HDWalletProvider` ([#23](https://github.com/zeppelinos/zos/issues/23))
- Retry transactions up to 3 times upon "nonce too low" errors ([#334](https://github.com/zeppelinos/zos-cli/issues/334))

## v1.4.0 - 2018-08-14

### Added
- Support to allow creating non-upgradeable instances of registered contracts

### Changed
- Contract deployments and transactions are executed with an estimate of the gas needed, instead of using the network default ([#211](https://github.com/zeppelinos/zos-lib/pull/211))
- Promisify all web3 function calls ([#205](https://github.com/zeppelinos/zos-lib/issues/205)) 

### Fixed
- Mark truffle-config as a prod dependency

## v1.3.0 - 2018-07-13

### Added
- Support custom Truffle build directories
- Reason messages to require statements
- Proxy wrapper object to allow querying proxies' admin and implementation
- Changelog file
- New `changeProxyAdmin` method in App contract and associated javascript model

### Changed
- Set testing environment in tests setup file
- Improve complex example tests
- Update Truffle to version 4.1.13
- Update OpenZeppelin to version 1.10.0
- Update pragma solidity to version ^0.4.24
- Use new solc constructor syntax

### Fixed
- Fix migratable initializers ensuring they can never be run more than once
- Fix freezable directory unset implementation method
- Fix `AdminUpgradeabilityProxy` shadowing issues

## v1.2.1 - 2018-06-29

### Fix
- Fix `App` wrapper hasStdlib function

## v1.2.0 - 2018-06-29

### Added
- Allow customising sync timeout in truffle-wrapped contracts

## v1.1.0 - 2018-06-28

### Added
- New functions to work with directories with `FileSystem`
- Upgradeability regression tests 
- Warn level to `Logger`
- Unset implementation method to `App`, `Package` and `Release` wrappers
- Has stdlib set functionality to `App` wrapper
- Expose different build paths being handled by Contracts object

### Changed
- Update dependencies for solidity-coverage dependency
- Polish NPM test script
- Improve test coverage
- Improve arguments logging for proxies initialization
- Replace colors dependency by chalk 

### Fixed
- Make `FileSystem` copy function synchronous
- Move solidity-coverage defaults params to Contracts object
- Mark ethereumjs-abi as production dependency
- Mark web3 as production dependency
- `UpgradeabilityProxyFactory` contract in-line documentation

### Removed
- Remove Truffle `Migrations` contract
