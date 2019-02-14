---
id: zos_lib
title: Using the ZeppelinOS programmatic library
---

ZeppelinOS has a JavaScript library. It is mainly used by the `zos`
command-line interface, which is the recommended way to use ZeppelinOS; but
this library can also be used directly to operate ZeppelinOS projects when a
programmatic interface is preferred or more flexibility and lower-level
access is required.

## Install Node and NPM

Let's install [Node.js](http://nodejs.org/) and
[npm](https://npmjs.com/), which are the dependencies to get started. On their
respective websites you will find specific instructions for your machine.

## Setting up your project

We'll need to create a directory for our project and access it:

```console
mkdir my-project
cd my-project

```

Use `npm` to create a `package.json` file:
```console
npm init
```

This command will ask you for details about the project. For this very basic
guide you can just press enter to accept the default values of each field.

Next, we need to install Truffle. To do so, run the following command:

```console
npm install truffle@5.0.4
```

Now, initialize the project as a Truffle project with:

```
npx truffle init
```

And make sure that you have the local network configured:
```
module.exports = {
  networks: {
    local: {
      host: 'localhost',
      port: 9545,
      gas: 5000000,
      gasPrice: 5e9,
      network_id: '*'
    }
  }
};
```

We'll be using [ganache](https://truffleframework.com/docs/ganache/quickstart) for local deployment, so let's install it:

```console
npm install --global ganache-cli
```

Now, install the ZeppelinOS JavaScript library running:

```console
npm install zos-lib
```

That's it! Our project is now fully set up for using ZeppelinOS programmatically.

## Adding some contracts

Now, let's write two simple contracts. The first in `contracts/MyContractV0`
with the following contents:

```solidity
pragma solidity ^0.5.0;

import "zos-lib/contracts/Initializable.sol";

contract MyContractV0 is Initializable {
  uint256 public value;

  function initialize(uint256 _value) initializer public {
    value = _value;
  }
}
```

The second in `contracts/MyContractV1`, and it will be almost the same as the
first one but with one extra function:

```solidity
pragma solidity ^0.5.0;

import "zos-lib/contracts/Initializable.sol";

contract MyContractV1 is Initializable {
  uint256 public value;

  function initialize(uint256 _value) initializer public {
    value = _value;
  }

  function add(uint256 _value) public {
    value = value + _value;
  }
}
```

The V1 contract is an upgrade for the V0 contract, so let's see how we can
use the ZeppelinOS library to apply this upgrade. For this, we need to
compile the contracts:

## Compiling the contracts

```console
npx truffle compile
```

## Running the script

And now, let's write our upgrading script in `index.js`:

```js
'use strict';

// Required by zos-lib when running from truffle
global.artifacts = artifacts;
global.web3 = web3;

const { Contracts, SimpleProject, ZWeb3 } = require('zos-lib')
ZWeb3.initialize(web3.currentProvider)

// Load the contract.
const MyContractV0 = Contracts.getFromLocal('MyContractV0');
const MyContractV1 = Contracts.getFromLocal('MyContractV1');

async function main() {

  // Instantiate a project.
  const initializerAddress = (await web3.eth.getAccounts())[1];
  const project = new SimpleProject('MyProject', { from: initializerAddress } );

  console.log('Creating an upgradeable instance of V0...');
  const proxy = await project.createProxy(MyContractV0, { initArgs: [42] })
  console.log('Contract\'s storage value: ' + (await proxy.methods.value().call()).toString() + '\n');

  console.log('Upgrading to v1...');
  const instance = await project.upgradeProxy(proxy.address, MyContractV1, { initMethod: 'add', initArgs: [1], initFrom: initializerAddress })
  console.log('Contract\'s storage new value: ' + (await instance.methods.value().call()).toString() + '\n');
}

// For truffle exec
module.exports = function(callback) {
  main().then(() => callback()).catch(err => callback(err))
};
```

As you can see on the code, this script was prepared to be executed with
Truffle. So let's open a new terminal and start a ganache network by running:

```console
ganache-cli --port 9545
```

And then, execute the script using Truffle:

```console
npx truffle exec index.js --network local
```

This is just a very simple example to show the basic functions of the
ZeppelinOS JavaScript library. You can find more examples in the
[ZeppelinOS repository](https://github.com/zeppelinos/zos/tree/master/examples).
