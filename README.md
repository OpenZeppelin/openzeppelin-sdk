# ZeppelinOS
[![Build Status](https://travis-ci.org/zeppelinos/zos.svg?branch=master)](https://travis-ci.org/zeppelinos/zos)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)

Multi-package repository for ZeppelinOS [library](https://github.com/zeppelinos/zos/tree/master/packages/lib#readme), [CLI](https://github.com/zeppelinos/zos/tree/master/packages/cli#readme), and [docs](https://github.com/zeppelinos/zos/tree/master/packages/docs#readme).

ZeppelinOS is a platform to develop, manage and operate smart contract applications in Ethereum. It can be used to create smart contract systems that can be fixed and improved over time, enabling developers to opt-in to mutability for their deployed code through [upgradeability patterns](https://blog.zeppelinos.org/proxy-patterns/).

## Getting started

Install ZeppelinOS and setup your project as described in the [Setup guide](https://docs.zeppelinos.org/docs/setup.html).

In order to build an upgradeable application with ZeppelinOS, follow our
[Building upgradeable applications](https://docs.zeppelinos.org/docs/building.html) guide.

If you would like to use the ZeppelinOS on-chain standard libraries in your app,
 follow our [Using the stdlib in your app](https://docs.zeppelinos.org/docs/using.html) guide.

If you are interested in deploying your own standard libraries for ZeppelinOS,
see our [Developing a new standard library](https://docs.zeppelinos.org/docs/developing.html) guide.

Two demo apps based on ZeppelinOS are described in [Basil](https://docs.zeppelinos.org/docs/basil.html) and [Crafty](https://docs.zeppelinos.org/docs/crafty.html).

## Sample

Quick sample on `zos` usage for initializing a project, registering a contract, creating an instance, and upgrading it after changing the original code. 

```sh
npm install --global zos
zos init my-project 0.1.0

vim contracts/MyContract.sol
zos add MyContract
zos session --network ropsten
zos push
zos create MyContract

vim contracts/MyContract.sol
zos push
zos update MyContract
```

## Guides

- [Installation and setup](https://docs.zeppelinos.org/docs/setup.html)
- [Building an upgradeable application](https://docs.zeppelinos.org/docs/building.html)
- [Using the stdlib in your app](https://docs.zeppelinos.org/docs/using.html)
- [Developing a new standard library](https://docs.zeppelinos.org/docs/developing.html)
- [Testing upgradeable applications](https://docs.zeppelinos.org/docs/testing.html)
- [Extend provided standard library code in your own contracts](https://github.com/zeppelinos/labs/tree/master/extensibility-study#extensibility-study) (experimental)
- [Migrate your non-upgradeable legacy ERC20 token into an upgradeable version with an opt-in approach](https://docs.zeppelinos.org/docs/erc20_onboarding.html)
- [Migrate your non-upgradeable legacy ERC20 token into an upgradeable version with a managed approach](https://github.com/zeppelinos/labs/tree/master/migrating_legacy_token_managed#migrating-legacy-non-upgradeable-token-to-upgradeability-with-managed-strategy) (experimental)


## Links

### Documentation
- [ZeppelinOS](http://zeppelinos.org)
- [Documentation site](https://docs.zeppelinos.org)
- [ZeppelinOS Blog](https://blog.zeppelinos.org)

### Code
- [ZeppelinOS CLI (`zos`)](https://github.com/zeppelinos/zos/tree/master/packages/cli#readme)
- [ZeppelinOS library (`zos-lib`)](https://github.com/zeppelinos/zos/tree/master/packages/lib#readme)

## Security

If you find a security issue, please contact us at security@zeppelinos.org. We give rewards for reported issues, according to impact and severity.

## License

Code released under the [MIT License](LICENSE.md)
