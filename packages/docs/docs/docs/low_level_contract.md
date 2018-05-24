---
id: low_level_contract
title: Low level upgradeable smart contract
sidebar_label: Low level upgradeable contract
---

> **Note**: this guide shows a low-level method for operating a single upgradeable smart contract. For a CLI-aided developer experience, use the [higher-level CLI guide](setup.md).

> **Note**: for a fully working project with this example, see the [`examples/simple`](https://github.com/zeppelinos/zos-lib/tree/master/examples/simple) folder of the `zos-lib` repository.

To develop an upgradeable smart contract, we need to create a simple [upgradeability proxy](https://blog.zeppelinos.org/proxy-patterns/). This is a [special contract](advanced.md#the-proxy-system) that will hold the storage of our upgradeable contract and redirect function calls to a `logic` contract, which we can update.

Let's walk through the following example to see how it works:

### Write the first version of the contract's logic

Let's start by creating the `MyContract.sol` file:

```js
import "zos-lib/contracts/migrations/Initializable.sol";

contract MyContract is Initializable {
  uint256 public value;

  function initialize(uint256 _value) isInitializer public {
    value = _value;
  }
}
```

Notice the `initialize` function. Most contracts require some sort of initialization function, but upgradeable contracts can't use constructors because the proxy won't be able to call them. This is why we need to use the [initializable pattern](advanced.md#initializers-vs-constructors) provided by `zos-lib`.

### Deploy it

Next, we deploy it to the blockchain:

```js
const myContract_v0 = await MyContract.new()
```

### Create a proxy

Now we are going to deploy the proxy. This is the contract that will receive the calls and hold the storage, while delegating its behavior to the logic contract, enabling us to upgrade it.

To do so, we need to provide the logic contract address to the proxy constructor:

```js
const proxy = await AdminUpgradeabilityProxy.new(myContract_v0.address)
```

### Initialize it

Next, call `initialize` on the proxy to initialize the state variables. Notice that we have to wrap the proxy in a `MyContract` interface, since all calls will be delegated from the proxy to the logic contract.

```js
let myContract = await MyContract.at(proxy.address)
const value = 42
await myContract.initialize(value)
console.log(await myContract.value()) // 42
```

### Add functionality

Now let's edit `MyContract.sol` to include an `add` function:

```js
import "zos-lib/contracts/migrations/Initializable.sol";

contract MyContract is Initializable {
  uint256 public value;

  function initialize(uint256 _value) isInitializer public {
    value = _value;
  }

  function add(uint256 _value) public {
    value = value + _value;
  }
}
```

> **Note**: when we update our logic contract's code, we can't change the proxy's [storage layout](advanced.md#preserving-the-storage-structure). This means we can't remove any previously existing state variables. We can, however, remove functions we don't want to use anymore.

### Upgrade it

Next, we will deploy our new logic and upgrade our proxy to use the new version:

```js
const myContract_v1 = await MyContract.new()
await proxy.upgradeTo(myContract_v1.address)
myContract = await MyContract.at(proxy.address)

await myContract.add(1);
console.log(await myContract.value()) // 43
```

Wohoo! We have upgraded our contract's functionality while preserving its storage, thus obtaining `43`.
