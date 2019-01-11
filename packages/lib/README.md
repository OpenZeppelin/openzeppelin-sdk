# ZeppelinOS JavaScript Library _(zos-lib)_

[![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg)](https://github.com/RichardLitt/standard-readme)
[![NPM Package](https://img.shields.io/npm/v/zos-lib.svg?style=flat-square)](https://www.npmjs.org/package/zos-lib)
[![Build Status](https://travis-ci.com/zeppelinos/zos.svg?branch=master)](https://travis-ci.com/zeppelinos/zos)
[![Coverage Status](https://coveralls.io/repos/github/zeppelinos/zos-lib/badge.svg?branch=master)](https://coveralls.io/github/zeppelinos/zos-lib?branch=master)

> JavaScript library for the ZeppelinOS smart contract platform.

ZeppelinOS is a platform to develop, deploy and operate smart contract
projects on Ethereum and every other EVM and eWASM-powered blockchain.

This is the repository for the ZeppelinOS JavaScript library. It is mainly used
by the
[`zos` command-line interface](https://github.com/zeppelinos/zos/tree/master/packages/cli#zeppelinos-command-line-interface),
which is the recommended way to use ZeppelinOS; but this library can also be
used directly to operate ZeppelinOS projects when a programmatic interface is
preferred or more flexibility and lower-level access is required.

## Install

First, install [Node.js](http://nodejs.org/) and [npm](https://npmjs.com/).
Then, install the ZeppelinOS JavaScript Library running:

```sh
npm install zos-lib
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
> const { ZWeb3, Contracts, SimpleProject } = require('zos-lib')
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

If you find a security issue, please contact us at security@zeppelinos.org. We
give rewards for reported issues, according to impact and severity.

## API

TODO.

## Maintainers

* [@facuspagnuolo](https://github.com/facuspagnuolo/)
* [@spalladino](https://github.com/spalladino)

## Contribute

To contribute, join our
[community channel on Telegram](https://t.me/zeppelinos) where you can talk to
all the ZeppelinOS developers, contributors, partners and users.

You can also follow the recent developments of the project in our
[blog](https://blog.zeppelin.solutions/) and
[Twitter account](https://twitter.com/zeppelinorg).

## License

[MIT](LICENSE.md) © Zeppelin
