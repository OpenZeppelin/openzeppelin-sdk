# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Handle stdlib semver syntax in the `status` command ([#290](https://github.com/zeppelinos/zos-cli/issues/290))
- Better wording from status command when a contract is scheduled to be removed ([#304](https://github.com/zeppelinos/zos-cli/issues/304))
- Fail with an explicit error when attempting to create a proxy for an stdlib that was linked but not pushed to the network ([#322](https://github.com/zeppelinos/zos-cli/pull/322))
- Include default timeout in `--timeout` flag help ([#302](https://github.com/zeppelinos/zos-cli/issues/302))

### Changed
- Swapped `TestApp` initializer parameters, it now accepts `txParams` first and an optional `ZosNetworkFile` object as a last argument.

## v1.1.0

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
