# ZeppelinOS Command Line Interface
[![NPM Package](https://img.shields.io/npm/v/zos.svg?style=flat-square)](https://www.npmjs.org/package/zos)
[![Build Status](https://travis-ci.org/zeppelinos/zos-cli.svg?branch=master)](https://travis-ci.org/zeppelinos/zos-cli)

:warning: **Under heavy development: do not use in production** :warning: 

This package provides a unified command line interface to [ZeppelinOS](https://zeppelinos.org/).

ZeppelinOS is a platform to develop, manage and operate smart contract applications in Ethereum. It can be used to create smart contract systems that can be fixed and improved over time, enabling developers to opt-in to mutability for their deployed code through [upgradeability patterns](https://blog.zeppelinos.org/proxy-patterns/).

`zos` also provides an interface to connect your application code to already deployed standard libraries from the [zOS Kernel](https://github.com/zeppelinos/kernel). If you wish a lower-level development experience, see [`zos-lib`](https://github.com/zeppelinos/zos-lib).

## Table of Contents

- [Getting Started](#getting-started)
  - [Install](#install)
  - [Basic usage](#basic-usage)
- [Examples](#examples)
- [Links](#links)
- [License](#license)

## Getting Started

### Install

To install `zos` simply run:
```sh
npm install --global zos
```

### Basic usage

#### Before you begin
`zos` integrates with [Truffle](http://truffleframework.com/), an Ethereum development environment. Please install Truffle and initialize your project with it:

```sh
npm install --global truffle
mkdir myproject && cd myproject
truffle init
```

#### Setup your project 
Initialize your project with ZeppelinOS. The next command will create a new `package.zos.json` file:

```sh
zos init <name> <version>
```
For example:
```sh
zos init myproject 0.1
```


## Examples

- [Develop an upgradeable smart contract application using `zos`](examples/development.md)
- [Testing a `zos` upgradeable application](examples/testing.md)
- [Develop a new zOS Kernel standard library release using `zos`](examples/kernel.md)
- [Use `zos` to fund development and auditing of zOS Kernel releases with your ZEP tokens](examples/vouching.md)
- [Extend provided zOS Kernel standard library code in your own contracts](https://github.com/zeppelinos/labs/tree/master/extensibility-study#extensibility-study) (experimental)
- [Migrate your non-upgradeable legacy ERC20 token into an upgradeable version with a managed approach](https://github.com/zeppelinos/labs/tree/master/migrating_legacy_token_managed#migrating-legacy-non-upgradeable-token-to-upgradeability-with-managed-strategy) (experimental)
- [Migrate your non-upgradeable legacy ERC20 token into an upgradeable version with an opt-in approach](https://github.com/zeppelinos/labs/tree/master/migrating_legacy_token_opt_in#migrating-legacy-non-upgradeable-token-to-upgradeability-with-opt-in-strategy) (experimental)


## Links

### Documentation
- [ZeppelinOS](http://zeppelinos.org)
- [ZeppelinOS Blog](https://blog.zeppelinos.org)
- [Proxy Patterns](https://blog.zeppelinos.org/proxy-patterns)

### Code
- [ZeppelinOS library (`zos-lib`)](https://github.com/zeppelinos/zos-lib)
- [ZeppelinOS kernel](https://github.com/zeppelinos/kernel)

## License

Code released under the [MIT License](LICENSE)
