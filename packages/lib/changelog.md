# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## v1.4.1 - 2018-08-22

### Fixed
- Fix critical error when running `push` with an `HDWalletProvider` ([#23](https://github.com/zeppelinos/zos/issues/23))
- Retry transactions up to 3 times upon "nonce too low" errors ([#334](https://github.com/zeppelinos/zos-cli/issues/334))

## v1.4.0 - 2018-08-14

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
