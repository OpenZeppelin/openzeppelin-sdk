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
npm install --global zos
```
Next, learn how to:

- [Develop an upgradeable smart contract application using `zos`](#develop).
- [Testing a `zos` upgradeable application](#testing)
- [Develop a new zOS Kernel standard library release using `zos`](#kernel).
- [Use `zos` to fund development and auditing of zOS Kernel releases with your ZEP tokens](#vouching).
- [Extend provided zOS Kernel standard library code in your own contracts](https://github.com/zeppelinos/labs/tree/master/extensibility-study#extensibility-study) (experimental).
- [Migrate your non-upgradeable legacy ERC20 token into an upgradeable version with a managed approach](https://github.com/zeppelinos/labs/tree/master/migrating_legacy_token_managed#migrating-legacy-non-upgradeable-token-to-upgradeability-with-managed-strategy) (experimental).
- [Migrate your non-upgradeable legacy ERC20 token into an upgradeable version with an opt-in approach](https://github.com/zeppelinos/labs/tree/master/migrating_legacy_token_opt_in#migrating-legacy-non-upgradeable-token-to-upgradeability-with-opt-in-strategy) (experimental).

## <a name="develop"></a>Develop an upgradeable smart contract application using `zos`

### Before you begin
`zos` integrates with [Truffle](http://truffleframework.com/), an Ethereum development environment. Please install Truffle and initialize your project with it:

```sh
npm install --global truffle
mkdir myproject && cd myproject
truffle init
```

### Setup your project 

Initialize your project with zeppelin_os. The next command will create a new `package.zos.json` file:

```sh
zos init [NAME] [VERSION] --network [NETWORK]
```
For example:
```sh
zos init myproject 0.1 --network development
```

### Write your smart contracts
Write your contracts as you would usually do, but replacing constructors with `initialize` functions. You can do this more easily by using the `Initializable` helper contract in [`zos-lib`](https://github.com/zeppelinos/zos-lib).

```sh
npm install zos-lib
```

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
zos add-implementation [CONTRACT_NAME_1] --network [NETWORK]
zos add-implementation [CONTRACT_NAME_2] --network [NETWORK]
...
zos add-implementation [CONTRACT_NAME_N] --network [NETWORK]
```

Where `[CONTRACT_NAME]` is the name of your Solidity contract, and `[ALIAS]` is the name under which it will be registered 
in zeppelin_os. 

In our example, run:
```
zos add-implementation MyContract --network development
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

Optionally, you can use the `-i` flag to call an initialization/migration function after you create the proxy.

In our simple example, we want to call the `initialize` function, with some value (e.g: 42) thus:
```
zos create-proxy MyContract -i initialize -p 40 --network development 
```

The proxy addresses, which you'll need to interact with your upgradeable contracts, will be stored in the `package.zos.<network>.json` file.

Open the `package.zos.<network>.json` and use the addresses found there to interact with your deployed contracts. Congratulations! The first version of your upgradeable smart contract app is deployed in the blockchain!

## Using a standard library

In addition to creating proxies for your own contracts, you can also re-use already deployed contracts from a zeppelin_os standard library. To do so, run the following command, with the name of the npm package of the stdlib you want to use. For example:

```bash
zos set-stdlib openzeppelin-zos --network [NETWORK]
```

The next `sync` operation will connect your application with the chosen standard library on the target network. However, if you're using development nodes (such as testrpc or ganache), the standard library is not already deployed, since you are running from an empty blockchain. To work around this, you can add a `--deploy-stdlib` flag to the `sync` command:

```bash
zos sync --network [NETWORK] --deploy-stdlib
```

This will deploy your entire application to the target network, along with the standard library you are using and all its contracts. This way, you can transparently work in development with the contracts provided by the stdlib.

From there on, you can create proxies for any contract provided by the stdlib:

```bash
zos create-proxy DetailedMintableToken --network [NETWORK]
```


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

We'll now use `zos` to register and deploy the new code for `MyContract` to the blockchain. Sync the new version of your project by running: 

```
zos sync --network [NETWORK]
```

After running this command, the new versions of your project's contracts are deployed in the blockchain. 
However, the already deployed proxies are still running with the old implementations. You need to upgrade
each of the proxies individually. To do so, you just need to run this for every contract: 

```
zos upgrade-proxy [ALIAS_1] [PROXY_ADDRESS_1] --network [NETWORK]
zos upgrade-proxy [ALIAS_2] [PROXY_ADDRESS_2] --network [NETWORK]
...
zos upgrade-proxy [ALIAS_N] [PROXY_ADDRESS_N] --network [NETWORK]
```

In our simple example:
```
zos upgrade-proxy MyContract [PROXY_ADDRESS_FOUND_IN_PACKAGE_ZOS_NETWORK_JSON] --network development
```
Voila! Your contract has now been upgraded. The address is the same as before, but the code has been changed to the latest version. Repeat the same steps for every code update you want to perform.

## <a name="testing"></a> Testing a `zos` upgradeable application

To simplify the testing process, you can use the `AppManager` class to set up your entire application (including a standard library) in the test network. This class also acts as wrapper to your deployed application, and can be used to programatically create new proxies of the contracts to test:

```js
import AppManager from 'zos/lib/models/AppManager';

const MyContract = artifacts.require('MyContract');
const MintableToken = artifacts.require('MintableToken');

contract('MyContract', function([owner]) {
  beforeEach(async function () {
    this.appManager = new AppManager(owner, 'test');
    await this.appManager.deployAll();
  });

  it('should create a proxy of MyContract', async function () {
    const proxy = await this.appManager.createProxy(MyContract, 'MyContract');
    const result = await proxy.y();
    result.toNumber().should.eq(1337)
  })

  it('should create and initialize a proxy of MyContract', async function () {
    const proxy = await this.appManager.createProxy(MyContract, 'MyContract', 'initialize', [42]);
    const result = await proxy.x();
    result.toNumber().should.eq(42)
  })

  it('should create a proxy from the stdlib', async function () {
    const proxy = await this.appManager.createProxy(MintableToken, 'MintableToken');
    const result = await proxy.totalSupply();
    result.toNumber().should.eq(0);
  })
});
```

## <a name="kernel"></a> Develop a new zOS Kernel standard library release using `zos`
The **zeppelin_os** kernel handles releases of the standard library. Any developer can register new stdlib releases with the kernel, which can then be vouched for by other users, earning the developer a fraction of the `ZepTokens` staked. The *zos* CLI allows developers to go through this process seamlessly, by creating distributions that handle the different releases of the stdlib. 

The first step is creating a distribution with the following command:
```
zos init-distribution <distribution-name> <kernel-address> --network=<network>.
```
Here, `<distribution-name>` is the name chosen for the distribution, and `<kernel-address>` is the address of the **zeppelin_os** kernel. The `network` parameter states which network will be used for deployment (use `development` for local testing, `ropsten` for testnet, and so on, as defined in your truffle configuration). 

Initializing the distribution will create a `package.zos.json` file that will track the contracts included in the distribution. After this first step, the desired contracts must be individually added to the distribution through:
```
zos add-implementation <contract-name> <alias> --network=<network>,
```
where `<contract-name>` is the name of the contract and the optional `<alias>` is an alternative reference to it. Note that this command must be repeated once for each contract included in the distribution. This will update the `package.zos.json` file with the contract names. 

Finally, we need to deploy the `Package` representing the distribution, the `Release` containing the stdlib, and the individual library contracts, which must then be registered in the kernel. All of this is accomplished by:
```
zos deploy --network=<network>.
```
This command creates a file `package.zos.<network>.json` that, apart from the included contracts, has the address of the `Package` representing the distribution. This completes the deployment of the new stdlib release to the chosen network.

Send your zOS Kernel standard library release address to other developers to get them to use it. If they think it's worth vouching tokens for, send them the guide below and start earning ZEP tokens!

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


