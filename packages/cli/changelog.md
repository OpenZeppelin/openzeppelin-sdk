# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
