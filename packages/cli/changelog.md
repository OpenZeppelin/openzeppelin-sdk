# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Models to wrap and interact with zos package files 
- Session command in order to specify a network session when running multiple commands
- Compare command to compare local status with the on-chain one
- Pull command to fetch remote on-chain status
- Write proxy address in contract build files on creation
- Remove command
- Add optional transaction timeout parameter to all commands
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
