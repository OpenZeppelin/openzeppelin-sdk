# Lightweight functions for creating upgradeable instances

Today, using ZeppelinOS involves spinning up an App with Factory, with a Package, with an ImplementationProvider where the implementations are registered, before a proxy can be created. Some users have expressed concern as to locking-in to this structure, and are interested only in using the proxies themselves.

Design a set of functions to just create an upgradeable instance of a contract, without requiring setting up a ZeppelinOS app. Consider integrating these functions with existing frameworks, such as web3 or truffle-contracts.

## Design

We can build different packages for different frameworks (truffle, web3, ethers), all of which depend on the Proxy contract. We could have them depend on `zos-lib`, or extract the proxy contracts to a smaller package.

The functions for each framework should mimick the code for creating a new contract in that framework. Given a contract class, these functions should deploy a new instance to act as the logic contract, create a proxy pointing to it, initialize it if needed, and return an instance of the contract class at the proxy's address.

The function should accept the same options as a regular transaction (from, gas, gasPrice), plus the following:
- `implementationAddress`: if provided, a new logic contract is not deployed, and the proxy is set to this address
- `proxyFactory`: if provided, the factory is used to create a proxy, instead of deploying one directly
- `initalizerMethodName`: if provided, name of the method to call for initialization (defaults to `initialize`)
- `upgradeabilityAdmin`: if provided, the upgradeability admin of the proxy is set to this address (defaults to `from`)
- `initializerAddress`: only to be implemented if we start working with initializer contracts

## Implementation with wrappers

An option for implementing this is to provide a function that actually wraps a class of a contract, overwriting the deployment and initialization methods (`new` and `at` for truffle, for instance) to deploy proxies, and add getters for `upgradeabilityAdmin` and `upgradeabilityProxy`. The examples on each framework follow this idea.

### truffle 4

Returns a wrapped truffle-contract instance of `MyContract` at the proxy address. Returns once both transactions that deploy the contracts have been mined. 
```js
const upgradeable = require('zos-truffle')
const MyContract = upgradeable(artifacts.require("MyContract"))
const myInstance = MyContract.new(initArg1, initArg2, ..., opts)
```

The returned instance can also respond to `upgradeabilityAdmin` and `upgradeabilityImplementation`, by using the [methods from Proxy.js](https://github.com/zeppelinos/zos/blob/master/packages/lib/src/utils/Proxy.js#L12-L20). This also applies if the contract is initialized via `at`.

```js
const upgradeable = require('zos-truffle')
const MyContract = upgradeable(artifacts.require("MyContract"))
const myInstance = await MyContract.at(address)
await myInstance.upgradeabilityAdmin() // => 0x1234...
```

### web3 0.2

Requires `data` with the bytecode of the implementation (if `implementationAddress` is not provided). Accepts a callback that returns a [`web3.eth.contract` instance](https://github.com/ethereum/wiki/wiki/JavaScript-API#web3ethcontract) populated with the ABI of `MyContract`. The callback should fire twice, emulating the behaviour of web3 0.2. If a callback is not supplied, creation should be sync.

```js
const upgradeable = require('zos-web3-0')
const MyContract = upgradeable(web3.eth.contract(JSON.parse(abi)));
const myInstance = MyContract.new(initArg1, initArg2, { data: initData }, (err, instance) => { /* ... */ })
```

The instance also responds to `upgradeabilityAdmin` and `upgradeabilityImplementation`.

## Implementation with standalone functions

An alternative to the upgradeability wrappers is to just have standalone functions, used for deployment and querying. This is more direct to implement, but does not follow the philosophy of the framework we integrate with.

### truffle 4

We provide standalone functions for deployment and querying. Usage for deployment ends up being similar to truffle's deployer used in migrations, and returns a regular instance of truffle-contract, instead of a wrapped one.

```js
const { deployUpgradeable, getUpgradeabilityAdmin, getImplementation } = require('zos-truffle')
const MyContract = artifacts.require("MyContract")
const myInstance = await deployUpgradeable(MyContract, initArg1, initArg2, ..., opts)
await getUpgradeabilityAdmin(myInstance) // => 0x1234...
```

## Implementation as lib Project

The `Project` class from zos-lib provides a facade to using the App, Package, and Provider contracts. An implementation with the same interface could be used for creating proxies, though not relying on those contracts.

The following `Project` methods are related to creating and managing proxies, and could be reused directly. Though the current `AppProject` require the implementation contract to be registered _before_ creating a proxy for it, we could lift this requirement, creating the implementation on the fly.

```js
async createProxy(contractClass, { packageName, contractName, initMethod, initArgs })
async upgradeProxy(proxyAddress, contractClass, { packageName, contractName, initMethod, initArgs })
async changeProxyAdmin(proxyAddress, newAdmin) 
```

These methods are related to version management and setting implementations, which would not be needed:
```js
async newVersion(version) 
async freeze()
async setImplementation(contractClass, contractName)
async unsetImplementation(contractName)
```

And these are related to dependency management, which could be added on a second version:

```js
async getDependencyPackage(name)
async getDependencyVersion(name)
async hasDependency(name)
async setDependency(name, packageAddress, version)
async unsetDependency(name)
```

This way, creating an upgradeable instance would be done with the following code:
```js
const Project = require('zos-lib').Project
const project = new Project()
const MyContract = artifacts.require("MyContract")
const myInstance = project.createProxy(MyContract, { initMethod: 'initialize', initArgs: [42] })
```