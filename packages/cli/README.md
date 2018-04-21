# zeppelin_os command line interface
[![NPM Package](https://img.shields.io/npm/v/zos.svg?style=flat-square)](https://www.npmjs.org/package/zos)
[![Build Status](https://travis-ci.org/zeppelinos/zos-cli.svg?branch=master)](https://travis-ci.org/zeppelinos/zos-cli)

:warning: **Under heavy development: do not use in production** :warning: 

`zos` is a tool to develop, manage and operate upgradeable smart contract applications in Ethereum. It can be used to create complex smart contract systems that can be fixed or improved over time, enabling developers to opt-in to mutability for their deployed code. `zos` also provides an interface to connect your application code to already deployed standard libraries from [the zOS Kernel](https://github.com/zeppelinos/kernel).

Use this tool if you want to develop, deploy or operate an upgradeable smart contract system.

If you want a lower-level, programmatic development experience, see [`zos-lib`](https://github.com/zeppelinos/zos-lib). 

# Getting Started

To install `zos` simply run:
```sh
npm i -g zos
```
Next, learn how to:

- [Develop an upgradeable smart contract application using `zos`](#develop).
- [Develop a new zOS Kernel standard library release using `zos`](#kernel).
- [Use `zos` to fund development and auditing of zOS Kernel releases with your ZEP tokens](#vouching).
- [Extend provided zOS Kernel standard library code in your own contracts](https://github.com/zeppelinos/labs/tree/master/extensibility-study#extensibility-study) (experimental).
- [Migrate your non-upgradeable legacy ERC20 token into an upgradeable version with a managed approach](https://github.com/zeppelinos/labs/tree/master/migrating_legacy_token_managed#migrating-legacy-non-upgradeable-token-to-upgradeability-with-managed-strategy) (experimental).
- [Migrate your non-upgradeable legacy ERC20 token into an upgradeable version with an opt-in approach](https://github.com/zeppelinos/labs/tree/master/migrating_legacy_token_opt_in#migrating-legacy-non-upgradeable-token-to-upgradeability-with-opt-in-strategy) (experimental).


## <a name="develop"></a>Develop an upgradeable smart contract application using `zos`

### Before you begin
`zos` integrates with [Truffle](http://truffleframework.com/), an Ethereum development environment. Please install Truffle and initialize your project with it:

```sh
npm install -g truffle
mkdir myproject && cd myproject
truffle init
```

### Setup your project 

Initialize your project with zeppelin_os. The next command will create a new `package.zos.json` file:

```sh
zos init [NAME] [VERSION] --network [NETWORK]
```

### Write your smart contracts
Write your contracts as you would usually do, but replacing constructors with `initialize` functions. You can do this more easily by using the `Initializable` helper contract in [`zos-lib`](https://github.com/zeppelinos/zos-lib).

- For an upgradeable contract development full example, see [the examples folder in `zos-lib`](https://github.com/zeppelinos/zos-lib/blob/master/examples/single/contracts/MyContract_v0.sol).
- For an introductory smart contract development guide, see [this blog post series](https://blog.zeppelin.solutions/a-gentle-introduction-to-ethereum-programming-part-1-783cc7796094).

In this example, we'll use this simple contract:
```sol
import "zos-lib/contracts/migrations/Initializable.sol";

contract MyContract is Initializable {
  uint256 public x;
  
  function initialize(uint256 _x) isInitializer public {
    x = _x;
  }
}
```


Before you continue, use truffle to compile your contracts:
```sh
npx truffle compile
```

### Register your initial contract implementations

The next step is to register all the contract implementations of the first `version` of your project. To do this please run:

```
zos add-implementation [CONTRACT_NAME_1] [ALIAS_2] --network [NETWORK]
zos add-implementation [CONTRACT_NAME_2] [ALIAS_2] --network [NETWORK]
...
zos add-implementation [CONTRACT_NAME_N] [ALIAS_N] --network [NETWORK]
```

Where `[CONTRACT_NAME]` is the name of your Solidity contract, and `[ALIAS]` is the name under which it will be registered 
in zeppelin_os. 

In our example, run:
```
zos add-implementation MyContract MyContract --network ropsten
```

To have your `package.zos.json` file always up-to-date, run `zos add-implementation` for every new contract you add to your project.

### Sync your project with the blockchain with `zos sync`

This command will deploy your upgradeable application to the blockchain:
```
zos sync --network [NETWORK]
```

The first time you run this command for a specific network, a new `package.zos.<network>.json` will be created. This file will reflect the status of your project in that network.

### Create upgradeability proxies for each of your contracts  

The next commands will deploy new proxies to make your contracts upgradeable:

```
zos create-proxy [ALIAS_1] --network [NETWORK]
zos create-proxy [ALIAS_2] --network [NETWORK]
...
zos create-proxy [ALIAS_N] --network [NETWORK]
``` 

In our simple example:
```
zos create-proxy MyContract --network ropsten
```

The proxy addresses, which you'll need to interact with your upgradeable contracts, will be stored in the `package.zos.<network>.json` file.

Open the `package.zos.<network>.json` and use the addresses found there to interact with your deployed contracts. Congratulations! The first version of your upgradeable smart contract app is deployed in the blockchain!

### Update your smart contract code
Some time later you might want to change your smart contract code: fix a bug, add a new feature, etc. 
To do so, update your contracts, making sure you don't change their pre-existing storage structure. This is required
by **zeppelin_os** upgadeability mechanism. This means you can add new state variables, but you can't remove the ones you already have. In the example above, this could be the new version of `MyContract`:

```sol
import "zos-lib/contracts/migrations/Initializable.sol";

contract MyContract is Initializable {
  uint256 public x;
  
  function initialize(uint256 _x) isInitializer public {
    x = _x;
  }
  
  function y() public pure returns (uint256) {
    return 1337;
  }
}
```

Use truffle to compile the new version of your code:
```sh
npx truffle compile
```

We'll now use `zos` to register and deploy the new code for `MyContract` to the blockchain.
Doing so is very easy: sync the new version of your project to the blockchain by running: 

```
zos sync --network [NETWORK]
```

After running this command, the new versions of your project's contracts are deployed in the blockchain. 
However, the already deployed proxies are still running with the old implementations. You need to upgrade
each of the proxies individually. To do so, you just need to run this for every contract: 

```
zos upgrade-proxy [ALIAS_1] --network [NETWORK]
zos upgrade-proxy [ALIAS_2] --network [NETWORK]
...
zos upgrade-proxy [ALIAS_N] --network [NETWORK]
```

In our simple example:
```
zos upgrade-proxy MyContract --network ropsten
```
Voila! Your contract has now been upgraded. The address is the same as before, but the code has been changed to the latest version. Repeat the same steps for every code update you want to perform.


## <a name="kernel"></a> Develop a new zOS Kernel standard library release using `zos`
TODO

## <a name="vouching"></a> Use `zos` to fund development and auditing of zOS Kernel releases with your ZEP tokens

To fund development of a zOS Kernel standard library release, you can vouch your ZEP tokens to that specific release. This will give a small payout to the release developer and incentivize further auditing and development of the code.

To vouch for the release you're using in your app, run:
```
zos vouch [RELEASE_ADDRESS] [ZEP_AMOUNT_IN_UNITS] --from [ZEP_HOLDING_ADDRESS]
```
If you want to stop supporting this release, run:
```
zos unvouch [RELEASE_ADDRESS] [ZEP_AMOUNT_IN_UNITS] --from [ADDRESS_THAT_VOUCHED]
```


