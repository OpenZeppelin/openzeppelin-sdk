---
id: zos_lib
title: Using the ZeppelinOS programmatic library
---

ZeppelinOS has a JavaScript library. It is mainly used by the `zos`
command-line interface, which is the recommended way to use ZeppelinOS; but
this library can also be used directly to operate ZeppelinOS projects when a
programmatic interface is preferred or more flexibility and lower-level
access is required.

## Installation

Let's install [Node.js](http://nodejs.org/) and
[npm](https://npmjs.com/), which are the dependencies to get started. On their
respective websites you will find specific instructions for your machine.

Truffle is also required, and we'll be using [ganache](https://truffleframework.com/docs/ganache/quickstart) for local deployment, so let's install them and initialize a directory for our project:

```console
npm install --global truffle ganache-cli
mkdir my-project
cd my-project
truffle init
```

Then, install the ZeppelinOS JavaScript library running:

```console
npm install zos-lib
```

Now, let's write two simple contracts. The first in `contracts/MyContractV0`
with the following contents:

```solidity
pragma solidity ^0.4.24;

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
pragma solidity ^0.4.24;

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

```console
truffle compile
```

And now, let's write our upgrading script in `index.js`:

```js
'use strict';

// Required by zos-lib when running from truffle
global.artifacts = artifacts;
global.web3 = web3;

const { Contracts, SimpleProject  } = require('zos-lib')
// Load the contract.
const MyContractV0 = Contracts.getFromLocal('MyContractV0');
const MyContractV1 = Contracts.getFromLocal('MyContractV1');

async function main() {
  // Instantiate a project.
  const project = new SimpleProject('MyProject', { from: web3.eth.accounts[0] });
  console.log('Creating an upgradeable instance of V0...');
  const proxy = await project.createProxy(MyContractV0, { initArgs: [42] })
  console.log('Contract\'s storage value: ' + (await proxy.value()).toString() + '\n');
  console.log('Upgrading to v1...');
  await project.upgradeProxy(proxy, MyContractV1, { initMethod: 'add', initArgs: [1], initFrom: initializerAddress })
  console.log('Contract\'s storage new value: ' + (await instance.value()).toString() + '\n');
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
We also need to configure a local network inside our `truffle.js` by adding the following:

```javascript
module.exports = {
  networks: {
    local: {
      host: 'localhost',
      port: 9545,
      network_id: '*'
    }
  }
};
```

Adnd then, execute the script using `truffle exec`:

```console
truffle exec index.js --network local
```

This is just a very simple example to show the basic functions of the
ZeppelinOS JavaScript library. You can find more examples in the
[ZeppelinOS repository](https://github.com/zeppelinos/zos/tree/master/examples).
