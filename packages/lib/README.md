> OpenZeppelin SDK is not being actively developed. We recommend using [Upgrades Plugins](https://docs.openzeppelin.com/upgrades-plugins/1.x/) instead.
>
> For more information, see [Building for interoperability: why we’re focusing on Upgrades Plugins](https://forum.openzeppelin.com/t/building-for-interoperability-why-we-re-focusing-on-upgrades-plugins/4088).

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

Suppose there is a contract called `MyContractV0` in the file
`contracts/MyContractV0.sol`, already compiled to
`build/contracts/MyContractV0.json`, and that there is a development blockchain
network running locally in port 8545.

Open a Node.js console:

```sh
node
```

```js
const Web3 = require('web3');
const { Contracts, ProxyAdminProject, ZWeb3 } = require('@openzeppelin/upgrades')

async function main() {
  // Create web3 provider and initialize OpenZeppelin upgrades
  const web3 = new Web3('http://localhost:8545');
  ZWeb3.initialize(web3.currentProvider)

  // Create an OpenZeppelin project
  const [from] = await ZWeb3.eth.getAccounts();
  const project = new ProxyAdminProject('MyProject', null, null, { from, gas: 1e6, gasPrice: 1e9 });

  // Deploy an instance of MyContractV0
  console.log('Creating an upgradeable instance of v0...');
  const MyContractV0 = Contracts.getFromLocal('MyContractV0');
  const instance = await project.createProxy(MyContractV0, { initArgs: [42] });
  const address = instance.options.address;
  console.log(`Contract created at ${address}`);

  // And check its initial value
  const initialValue = await instance.methods.value().call();
  console.log(`Initial value is ${initialValue.toString()}\n`);

  // Upgrade it to V1
  console.log('Upgrading to v1...');
  const MyContractV1 = Contracts.getFromLocal('MyContractV1');
  const instanceV1 = await project.upgradeProxy(instance.options.address, MyContractV1);
  console.log(`Contract upgraded at ${instanceV1.options.address}`);

  // And check its new `add` method, note that we use instanceV1 since V0 has no `add` in its ABI
  await instanceV1.methods.add(10).send({ from, gas: 1e5, gasPrice: 1e9 });
  const newValue = await instance.methods.value().call();
  console.log(`Updated value is ${newValue.toString()}\n`);
}

main();
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
