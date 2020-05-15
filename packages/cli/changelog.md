# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## v2.8.2 - 2020-04-13

### Fixed
- Fixed the text of `oz deploy --help`. ([#1521](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1521))

## v2.8.1 - 2020-04-08

### Fixed
- Fixed a bug preventing usage of `deploy` with contracts from dependencies. ([#1515](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1515))

## v2.8.0 - 2020-03-25

### Added
- Added new `deploy` command for deploying without upgradeability. ([#1376](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1376))

### Changed
- Push only the required contract in `create`. ([#1426](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1426))

## v2.7.0 - 2020-02-10

### Added
- Generate typechain contract wrappers in a typescript project. ([#1285](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1285))
- Add `path` property to `network.js` config file, to be used together with `protocol`, `host`, and `port`. Add `url` shorthand property as well. ([#1386](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1386))
- Support for tuple parameters when calling methods in interactive commands such as `send-tx`, `create`, or `upgrade`. ([#1333](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1333))
- Solidity libraries in a project can now recursively link to other Solidity libraries. ([#1252](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1252))
- Add new `blockTimeout` command-line option that sets [`web3#transactionBlockTimeout`](https://web3js.readthedocs.io/en/v1.2.2/web3-eth.html#transactionblocktimeout). ([#1402](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1402))
- Warn when importing `@openzeppelin/contracts` instead of `@openzeppelin/contracts-ethereum-package`. ([#1335](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1335))

### Changed
- [**breaking**] Remove support for ambiguous Solidity imports relative to the current file not starting with a dot, to prevent corrupted artifacts. Warn when duplicate contract names are found. ([#1411](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1411))
- Use solidity fuzzy-import parser, to speed up nothing-to-compile checks by a 40%, and lazy-load truffle-flattener to decrease CLI startup time. ([#1291](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1291))
- Disable interactivity if stdin is not a terminal. ([#1299](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1299))

### Fixed
- Abort interactive `create` or `upgrade` processes on contract validation errors, such as having a constructor. ([#1382](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1382))
- Load `gas` and `gasPrice` from network configuration file. ([#1345](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1345))
- Command-line option `timeout` now properly sets [`web3#transactionPollingTimeout`](https://web3js.readthedocs.io/en/v1.2.2/web3-eth.html#transactionpollingtimeout). ([#1402](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1402))
- Sort commands in alphabetical order for `--help`. ([#1321](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1321))
- Prevent corruption of compiled artifacts if there are multiple contracts with the same name. ([#1296](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1296))
- Ensure relative paths are stored in project configuration file. ([#1384](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1384))
- Improve error message if no networks are set in `network.js` configuration file. ([#1394](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1394))

### Internal
- Use the OpenZeppelin CLI to compile and test contracts in the OpenZeppelin CLI. ([#1294](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1294), [#1288](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1288))

## v2.6.0 - 2019-11-07

### Added
- Opt-in to report anonymous usage statistics ([#1226](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1226), [#1266](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1266), [#1275](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1275))

### Fixed
- Avoid showing variable name on prompt message if not available ([#1224](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1224))
- Improve create and upgrade commands wording in prompts ([#1201](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1201)) (thanks @melnikaite!)
- Set default EVM version depending on solc version ([#1208](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1208)) (thanks @melnikaite!)
- Set expected default values for compiler ([#1202](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1202)) (thanks @melnikaite!)

### Changed
- Bump `web3` version to `web3@1.2.2`. ([#1277](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1277))

### Internal
- Migrate project from npm to yarn, using yarn workspaces together with lerna ([#1241](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1241))

## v2.5.3 - 2019-08-18

### Added
- Allow specifying a branch on the `unpack` command, using the syntax `openzeppelin unpack org/repo#branch`. ([#1190](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1190))
- Add `gsn` shortname for `openzeppelin/starter-kit-gsn`. ([#1196](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1196))

### Changed
- Bump `web3` version to `web3@1.2.1`. ([#1192](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1192))

### Fixed
- Increase stdio buffer for the post unpack starter kit hook. ([#1191](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1191))

## v2.5.2 - 2019-07-26

### Added
- New `openzeppelin accounts` command that lists available accounts on a network connection. ([#1130](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1130))

### Changed
- Migrated from `web3@1.0.0-beta.37` to the stable `web3@1.2.0` release. ([#1152](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1152))

### Fixed
- JSON artifacts generated by `openzeppelin compile` are now formatted. ([#1161](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1161))
- Name and version of the project are now validated in the `oz init` interactive command. ([#1148](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1148))

## v2.5.1 - 2019-07-22

### Changed
- `link` interactive command now installs an Ethereum Package with a caret by default. ([#1146](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1146))

### Fixed
- Fixes error `Could not find dependency` when `link`ing Ethereum Packages published within an npm organization. ([#1138](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1138))
- Removed incorrect prompt to deploy dependencies to the current network when they were already deployed. ([#1141](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1141))
- `link` interactive command works properly on Windows. ([#1146](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1146))

## v2.5.0 - 2019-07-19

### Changed
- Rename `zos` package to `@openzeppelin/cli`. ([#1077](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1077))
- Rename `zos` command to `openzeppelin`. ([#1074](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1074), [#1128](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1128))
- Rename Project, Network, Session and Lock files. ([#1040](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1040), [#1091](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1091))
- Rename ZeppelinOS/zos text references. ([#1077](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1077), [#1011](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1111), [#1129](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1129))
- Add support to new `Zepkit` kits in `unpack` command. ([#1078](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1078))
- Rename compiler manager to `openzeppelin`. ([#1097](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1097))

### Fixed
- Use Array.isArray instead of deprecated `lodash.isarray`. ([#1127](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1127))
- Fix `set-admin` description format. ([#1117](https://github.com/OpenZeppelin/openzeppelin-sdk/pull/1117))

## v2.4.2 - 2019-07-18

### Fixed
- The `-f` flag was used for specifying the `--from` option in several commands, and at the same time for setting the `--force` toggle in `push` and `set-admin`; now it is only used for `--from`, and `--force` only accepts the long form. ([#1123](https://github.com/zeppelinos/zos/pull/1123)) (thanks @pcowgill for the report!)
- Preserve truffle deployment info stored in contract artifacts when compiling. ([#1100](https://github.com/zeppelinos/zos/pull/1100))
- Linked EVM packages lookup works properly when dependencies are hoisted. ([#1110](https://github.com/zeppelinos/zos/pull/1110)) (thanks @PaulRBerg for the report!)
- Do not throw an error if the `contracts` local folder is missing. ([#1107](https://github.com/zeppelinos/zos/pull/1107))
- Properly detect when an Ethereum Package is on an older version for pushing it to the local network for development. ([#1119](https://github.com/zeppelinos/zos/pull/1119))
- Store proxy admin address for the first proxy created in a network. ([#1124](https://github.com/zeppelinos/zos/pull/1124))

## v2.4.1 - 2019-07-02

### Fixed
- `zos compile` now works properly on Windows. ([#1066](https://github.com/zeppelinos/zos/pull/1066))
- Spinners are now shown properly on Windows. ([#1067](https://github.com/zeppelinos/zos/pull/1067))
- Installation issues with yarn now fixed. ([#1059](https://github.com/zeppelinos/zos/pull/1059))

## v2.4.0 - 2019-06-24

### Added
- New `zos compile` command that uses solc directly to compile your contracts, generating artifacts with a format compatible to truffle's. The compiler version and optimizer settings can be controlled via command flags that are persisted on the `zos.json` file. The CLI will now default to this compiler when running commands that require compilation (like `add` or `create`), unless there are no compiler settings on `zos.json` and there is a `truffle.js` present in the project root, in which case it will rely on `truffle compile` as usual. ([#914](https://github.com/zeppelinos/zos/pull/914), [#940](https://github.com/zeppelinos/zos/pull/940), [#945](https://github.com/zeppelinos/zos/pull/945), [#953](https://github.com/zeppelinos/zos/pull/953), [#956](https://github.com/zeppelinos/zos/pull/956), [#959](https://github.com/zeppelinos/zos/pull/959), [#963](https://github.com/zeppelinos/zos/pull/963))
- New `networks.js` default configuration file for specifying networks connections. This file replaces the truffle config file in specifying the available networks for the CLI, and shares most of its format. A `truffle.js` or `truffle-config.js` can still be used. ([#918](https://github.com/zeppelinos/zos/pull/918), [#949](https://github.com/zeppelinos/zos/pull/949))
- New `zos call` and `zos send-tx` interactive commands for interacting with a contract directly from the command line, by calling a constant method or sending a transaction to a function. ([#848](https://github.com/zeppelinos/zos/pull/848), [#853](https://github.com/zeppelinos/zos/pull/853))
- New `zos balance` and `zos transfer` commands for querying and transferring ETH directly from the command line. The `balance` command additionally supports an `--erc20` flag to query the balance of an ERC20 token instead of ETH. ([#823](https://github.com/zeppelinos/zos/pull/823), [#834](https://github.com/zeppelinos/zos/pull/834))
- Added validations to method arguments in the interactive prompt. ([#1018](https://github.com/zeppelinos/zos/pull/1018))
- [**experimental**] Add minimal proxy support ([EIP 1167](http://eips.ethereum.org/EIPS/eip-1167)) via a `--minimal` flag when running `zos create`. Instances created this way will not be upgradeable, but consume much less gas than their upgradeable counterpart. ([#850](https://github.com/zeppelinos/zos/pull/850))

### Changed
- Reworked all log outputs in the application to be less verbose and more user-friendly. The `--verbose` flag re-enables the previous logging level. ([#915](https://github.com/zeppelinos/zos/pull/915), [#948](https://github.com/zeppelinos/zos/pull/948), [#969](https://github.com/zeppelinos/zos/pull/969), [#988](https://github.com/zeppelinos/zos/pull/988), [#1003](https://github.com/zeppelinos/zos/pull/1003))
- [**breaking**] The `ConfigVariablesInitializer` class of the CLI programmatic interface has been renamed to `ConfigManager`. ([#918](https://github.com/zeppelinos/zos/pull/918/))
- [**breaking**] The `initMethod` and `initArgs` parameter names of the CLI programmatic interface were changed to `methodName` and `methodArgs` respectively. ([#841](https://github.com/zeppelinos/zos/pull/841))

### Fixed
- Do not list contracts already added in interactive prompt when running `zos add`. ([#904](https://github.com/zeppelinos/zos/pull/904))
- Fixed error `Cannot find method forEach of undefined` when two contracts with the same name are present in the project. ([#880](https://github.com/zeppelinos/zos/pull/880))
- Support invoking a method in a contract when there is another method with the same name and number of arguments. ([#1019](https://github.com/zeppelinos/zos/pull/1019))
- Fixed parsing of array, boolean, and integer arguments when calling a method via the interactive prompt. ([#976](https://github.com/zeppelinos/zos/pull/976), [#987](https://github.com/zeppelinos/zos/pull/987))

### Removed
- [**breaking**] Removed the `status` command, which was unmaintained and failing in certain scenarios.

### Internal
- Removed TSlint in favor of prettier and ESLint. ([#920](https://github.com/zeppelinos/zos/pull/920))
- Add integration tests for starter boxes, to ensure that the latest version of the CLI is always compatible with zepkit. ([#913](https://github.com/zeppelinos/zos/pull/913), [#957](https://github.com/zeppelinos/zos/pull/957))

## v2.3.0 - 2019-05-27

### Added
- Add interactive prompts for most CLI commands (`add`, `create`, `init`, `link`, `publish`, `push`, `remove`, `session`, `set-admin`, `unlink`, `update`, `verify`), plus a `--no-interactive` flag to ensure that no prompts are shown when working in a non-interactive script ([#792](https://github.com/zeppelinos/zos/pull/792), [#766](https://github.com/zeppelinos/zos/pull/766), [#750](https://github.com/zeppelinos/zos/pull/750), [#745](https://github.com/zeppelinos/zos/pull/745), [#730](https://github.com/zeppelinos/zos/pull/730), [#725](https://github.com/zeppelinos/zos/pull/725), [#839](https://github.com/zeppelinos/zos/pull/839))
- Support `ZOS_NON_INTERACTIVE` environment variable, as well as `DEBIAN_FRONTEND=noninteractive`, to disable interactive prompts in scripts ([#887](https://github.com/zeppelinos/zos/pull/887))
- Add `zos unpack` command for initializing a new zepkit from any github repository with a `kit.json` specification, with the shortcuts `tutorial` and `zepkit` already set to official packs ([#822](https://github.com/zeppelinos/zos/pull/822), [#869](https://github.com/zeppelinos/zos/pull/869))
- Add `zos create2` command for deploying proxies to a predefined address determined via a salt and the sender address, or an off-chain signature of a sender ([#805](https://github.com/zeppelinos/zos/pull/805), [#757](https://github.com/zeppelinos/zos/pull/757)), checking before deployment that the address had not been already deployed to ([#788](https://github.com/zeppelinos/zos/pull/788)) (thanks @siromivel!)
- Add test to `truffle-migrate` sample project on CI ([#775](https://github.com/zeppelinos/zos/pull/775)) (thanks @paulinablaszk!)

### Changed
- Add support to `set-admin` command for changing the owner of the `ProxyAdmin` component, so ownership of the entire application can be moved to a different entity in a single transaction ([#804](https://github.com/zeppelinos/zos/pull/804))
- Commands can now be run from any subfolder in the project ([#818](https://github.com/zeppelinos/zos/pull/818))

### Fixed
- Fix issue `truffle-migrate` example ([#763](https://github.com/zeppelinos/zos/pull/763)) (thanks @hardlydifficult!)
- Output a message notifying if no contracts were pushed in a `zos push` ([#888](https://github.com/zeppelinos/zos/pull/888))
- Remove dependency `web3-provider-engine`, which was no longer needed, and caused all of `babel` to be installed along with the CLI ([#909](https://github.com/zeppelinos/zos/pull/909))
- Show a reasonable error message if a `zos.json` or `zos.network.json` file is malformed ([#881](https://github.com/zeppelinos/zos/pull/881))
- Store proxy admin and proxy factory addresses in `zos.network.json` upon a `push` if the upload of a contract failed ([#860](https://github.com/zeppelinos/zos/pull/860))

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
- Swapped `TestApp` initializer parameters, it now accepts `txParams` first and an optional `NetworkFile` object as a last argument.

## v1.1.0 - 2018-06-28

### Added
- New `session` command to pin a network, timeout, and sender address
- New `remove` command to remove a logic contract from a project
- Flag `--fetch` in `status` command retrieve app information directly from the network instead of from the local network file
- Flag `--fix` in `status` command to update the local network file with information retrieved from the network
- Models `ProjectFile` and `NetworkFile` to manage zos JSON files 
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
