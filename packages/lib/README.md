# OpenZeppelin SDK JavaScript Library _(@openzeppelin/upgrades)_

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg)](https://github.com/RichardLitt/standard-readme)
[![NPM Package](https://img.shields.io/npm/v/@openzeppelin/upgrades.svg?style=flat-square)](https://www.npmjs.org/package/@openzeppelin/upgrades)
[![CircleCI](https://circleci.com/gh/OpenZeppelin/openzeppelin-sdk/tree/master.svg?style=shield)](https://circleci.com/gh/OpenZeppelin/openzeppelin-sdk/tree/master)

> JavaScript library for the OpenZeppelin smart contract platform.

OpenZeppelin SDK is a platform to develop, deploy and operate smart contract
projects on Ethereum and every other EVM and eWASM-powered blockchain.

This is the repository for the OpenZeppelin SDK JavaScript library. It is mainly used
by the
[`openzeppelin-sdk` command-line interface](https://github.com/OpenZeppelin/openzeppelin-sdk/tree/master/packages/cli#openzeppelin-sdk-command-line-interface-openzeppelincli),
which is the recommended way to use the OpenZeppelin SDK; but this library can also be
used directly to operate projects when a programmatic interface is
preferred or more flexibility and lower-level access is required.

## Install

First, install [Node.js](http://nodejs.org/) and [npm](https://npmjs.com/).
Then, install the OpenZeppelin SDK JavaScript Library running:

```sh
npm install @openzeppelin/upgrades
```

## Usage

Suppose there is a contract called `MyContract` in the file
`contracts/MyContract.sol`, already compiled to
`build/contracts/MyContract.json`, and that there is a development blockchain
network running locally in port 9545.

Open a Node.js console:

```sh
node
```

```js
> const { ZWeb3, Contracts, SimpleProject } = require('@openzeppelin/upgrades')
> // Initialize a web3 provider.
> ZWeb3.initialize("http://localhost:9545")
> // Load the contract.
> const MyContract = Contracts.getFromLocal('MyContract')
> // Instantiate a project.
> myProject = new SimpleProject('MyProject', { from: await ZWeb3.defaultAccount() })
> // Create a proxy for the contract.
> myProject.createProxy(MyContract).then(proxy => myProxy = proxy)
> // Make a change on the contract, and compile it.
> const MyContractUpgraded = Contracts.getFromLocal('MyContract')
> myProject.upgradeProxy(proxy, MyContractUpgraded)
```

## Security

If you find a security issue, please contact us at security@openzeppelin.com. We
give rewards for reported issues, according to impact and severity.

## API

TODO.

## Maintainers

* [@spalladino](https://github.com/spalladino)
* [@jcarpanelli](https://github.com/jcarpanelli)
* [@ylv-io](https://github.com/ylv-io)

## Contribute

To contribute, join our
[community channel on Telegram](https://t.me/zeppelinos) where you can talk to
all the OpenZeppelin developers, contributors, partners and users.

You can also follow the recent developments of the project in our
[blog](https://blog.openzeppelin.com/) and
[Twitter account](https://twitter.com/openzeppelin).

## License

[MIT](LICENSE.md) © OpenZeppelin
