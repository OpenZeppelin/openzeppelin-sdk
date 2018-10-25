# ZeppelinOS vouching _(zos-vouching)_

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg)](https://github.com/RichardLitt/standard-readme)
[![Build Status](https://travis-ci.org/zeppelinos/zos-vouching.svg?branch=master)](https://travis-ci.org/zeppelinos/zos-vouching)

> Vouching logic for the EVM packages of the ZeppelinOS smart contract platform

ZeppelinOS is a platform to develop, deploy and operate smart contract
projects on Ethereum and every other EVM and eWASM-powered blockchain.

This is the repository for the ZEP Token and the contracts to use it to vouch
for EVM Packages.

## Background

ZeppelinOS provides a mechanism in which an EVM package can be registered and
vouched for using ZEP tokens. The tokens vouched for an EVM package can be
challenged by other ZEP holders whenever a deficiency in the EVM package is
presented for evaluation. In such a situation, the package's vouched tokens
could be slashed in favor of the challenger.

The end goal is that this simple mechanism will allow ZEP that is vouched for
an EVM package to represent:

* A measure of the quality of the code of the EVM package.
* A measure of the support that the EVM package has from the community.
* A financial buffer for the development of new features in the EVM package.
* A financial buffer for the auditing of the code of the EVM package.

## Install

First, install [Node.js](http://nodejs.org/) and [npm](https://npmjs.com/).
Then, install the vouching contracts running:

```sh
npm install zos-vouching
```

## Usage

Currently, the ZeppelinOS vouching mechanism can be used only by calling the
[Vouching.sol](contracts/Vouching.sol) contract directly. The address of this
deployed contract can be found in the `zos.<network>.json` files, that have
just been installed to the `node_modules/zos-vouching/` directory.

For example, open `truffle console --network <network>` and run:

```sh
truffle(<network>)> vouching = Vouching.at(<vouching-contract-address>)
```

Then create a dependency calling:

```sh
truffle(<network>)> vouching.create(name, owner, dependencyAddress, initialStake)
```

Where `name` is a string that will represent the dependency, `owner` is the
address of the account that will own the dependency, `dependencyAddress` is
the address of the EVM package and `initialStake` is the amount to be vouched.

After the dependency is created, the owner can vouch or unvouch tokens to the
EVM package:

```sh
truffle(<network>)> vouching.vouch(name, amount)
```

or:

```sh
truffle(<network>)> vouching.unvouch(name, amount)
```

## Security

If you find a security issue, please contact us at security@zeppelinos.org. We
give rewards for reported issues, according to impact and severity.

## Maintainers

* [@facuspagnuolo](https://github.com/facuspagnuolo/)
* [@fiiiu](https://github.com/fiiiu)

## Contribute

To contribute, join our
[community channel on Telegram](https://t.me/zeppelinos) where you can talk to
all the ZeppelinOS developers, contributors, partners and users.

You can also follow the recent developments of the project in our
[blog](https://blog.zeppelin.solutions/) and
[Twitter account](https://twitter.com/zeppelinorg).

## License

[MIT](LICENSE.md) © Zeppelin
