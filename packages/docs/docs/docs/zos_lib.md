---
id: sdk_js_library
title: Using the OpenZeppelin SDK programmatic library
---

The OpenZeppelin SDK has a JavaScript library. It is mainly used by the `openzeppelin`
command-line interface, which is the recommended way to use the OpenZeppelin SDK; but
this library can also be used directly to operate OpenZeppelin SDK projects when a
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

Now, install the OpenZeppelin SDK JavaScript library running:

```console
npm install @openzeppelin/upgrades
```

That's it! Our project is now fully set up for using the OpenZeppelin SDK programmatically.

## Adding some contracts

Now, let's write two simple contracts. The first in `contracts/MyContractV0`
with the following contents:

```solidity
pragma solidity ^0.5.0;

import "@openzeppelin/upgrades/contracts/Initializable.sol";

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

import "@openzeppelin/upgrades/contracts/Initializable.sol";

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
use the OpenZeppelin SDK library to apply this upgrade. For this, we need to
compile the contracts:

## Compiling the contracts

```console
npx truffle compile
```

## Running the script

And now, let's write our upgrading script in `index.js`:

```js
// Required by @openzeppelin/upgrades when running from truffle
global.artifacts = artifacts;
global.web3 = web3;

// Import dependencies from OpenZeppelin SDK programmatic library
const { Contracts, SimpleProject, ZWeb3 } = require('@openzeppelin/upgrades')

async function main() {

  /* Initialize OpenZeppelin's Web3 provider. */
  ZWeb3.initialize(web3.currentProvider)

  /* Retrieve compiled contract artifacts. */
  const MyContract_v0 = Contracts.getFromLocal('MyContract_v0');
  const MyContract_v1 = Contracts.getFromLocal('MyContract_v1');

  /* Retrieve a couple of addresses to interact with the contracts. */
  const [creatorAddress, initializerAddress] = await ZWeb3.accounts();

  /* Create a SimpleProject to interact with OpenZeppelin programmatically. */
  const myProject = new SimpleProject('MyProject', null, { from: creatorAddress });

  /* Deploy the contract with a proxy that allows upgrades. Initialize it by setting the value to 42. */
  const instance = await myProject.createProxy(MyContract_v0, { initArgs: [42] })
  console.log('Contract\'s storage value:', (await instance.methods.value().call({ from: initializerAddress })).toString());
  
  /* Upgrade the contract at the address of our instance to the new logic, and initialize with a call to add. */
  await myProject.upgradeProxy(instance.address, MyContract_v1, { initMethod: 'add', initArgs: [1] });
  console.log('Contract\'s storage new value:', (await instance.methods.value().call({ from: initializerAddress })).toString());
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
OpenZeppelin SDK JavaScript library. You can find more examples in the
[OpenZeppelin SDK repository](https://github.com/OpenZeppelin/openzeppelin-sdk/tree/master/examples).
