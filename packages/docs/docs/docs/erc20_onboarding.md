---
id: erc20_onboarding
title: Onboarding legacy contracts
---

## Intro
This guide covers the migration of a regular ERC20 token to an upgradeable version of itself. During this process, the
original contract (to be called "legacy") and the new contract, which will have the ability of being upgradeable, will coexist.

The _new upgradable contract_ will have the same functionality provided by the _legacy_ contract, but it will be
*upgradable*. This means that we will be able to add new functionality, store new data, fix bugs or support new
standards as many times as we need, without any need to perform new migrations in the future.

## Strategy

This strategy is based on an optional migration of the token balances. This migration is performed and paid by the
token holders. The new upgradeable token contract starts with no initial supply and no balances. The only way to "mint"
the new tokens is for users to "turn in" their old ones. This is done by first approving the amount they want to migrate,
and then calling a function of the upgradeable token to carry out the migration. The old tokens are sent to a burn
address, and the holder receives an equal amount in the new token contract.

This proposal is based on one of the two strategies explored by the ZeppelinOS dev team. To read more about them please
visit our [labs repository](https://github.com/zeppelinos/labs).

## Requirements

This on-boarding plan considers the following assumptions:
- There is an already deployed token contract that follows the ERC20 standard.
- The legacy token contract is not frozen or paused, so token holders can trade it.

## Onboarding plan demo

The central idea of this proposal is to deploy an upgradeable version of your token, using the ZeppelinOS command line
tool. To do so, we will use a migration contract provided by the [OpenZeppelin EVM package for ZeppelinOS](https://github.com/OpenZeppelin/openzeppelin-solidity/tree/zos-release).

To better describe this plan we will use a sample project you can follow and clone from [here](https://github.com/zeppelinos/erc20-opt-in-onboarding).

>**Caveat:** *The migration contract is not yet released in the OpenZeppelin EVM package, but will be soon. In the meantime,
the sample repository we will use includes such implementation to make things easier for the demonstration. You will see
a [`MigratableERC20`](https://github.com/zeppelinos/erc20-opt-in-onboarding/blob/master/contracts/openzeppelin-zos/MigratableERC20.sol)
contract inside the contracts folder.*

We will now setup a local environment to demo the onboarding plan. To do this, we will deploy a
sample legacy token contract and mint some balances. If you wish to work with your already deployed token, you can skip
the following lines and jump directly to the [step 1](erc20_onboarding.html#1-initialize-your-migration-project-with-zeppelinos).

In the sample repository you will find a contract called [`MyLegacyToken`](https://github.com/zeppelinos/erc20-opt-in-onboarding/blob/master/contracts/MyLegacyToken.sol)
that we will use to simulate a real scenario locally. As you can see, this token will mint 100 tokens to the owner once
initialized just for testing purpose.

_Before we begin, remember to install the dependencies running `npm install`. Additionally, you should check everything
is working as expected by running the test files with `npm test`._

Now, let's deploy the legacy token. We will use a truffle development console. You can start it by running
`npx truffle develop`. Then, run the following commands:

```console
truffle(develop)> compile
truffle(develop)> owner = web3.eth.accounts[1]
truffle(develop)> MyLegacyToken.new('MyToken', 'MTK', 18, { from: owner }).then(i => legacyToken = i)
truffle(develop)> legacyToken.address
'0x...'
```

Keep track of the `owner` and `legacyToken` addresses, we will need them in the following steps.

You can check the owner balance by running:
```console
truffle(develop)> legacyToken.balanceOf(owner)
BigNumber { s: 1, e: 0, c: [ 100 ] }
```

Remember not to close this console, as we will be using it later.

### 1. Initialize your migration project with ZeppelinOS

If you haven't installed the ZeppelinOS CLI, run the following command in your terminal:
```console
npm install --global zos
```

To initialize this project with ZeppelinOS, open a terminal and run the following line:

```console
zos init my-token-migration 1.0.0
```

We have just initialized a new ZeppelinOS project. A new `zos.json` file should have been created.

Next, we will have to modify the legacy token contract to get the new upgradeable version of it where the current balances
are going to be migrated.

In our sample project, you will find another contract called [`MyUpgradeableToken`](https://github.com/zeppelinos/erc20-opt-in-onboarding/blob/master/contracts/MyUpgradeableToken.sol)
which is the upgradeable version of the sample legacy token contract [`MyLegacyToken`](https://github.com/zeppelinos/erc20-opt-in-onboarding/blob/master/contracts/MyLegacyToken.sol):

```solidity
import "./openzeppelin-zos/MigratableERC20.sol";
import "openzeppelin-zos/contracts/token/ERC20/DetailedERC20.sol";
import "openzeppelin-zos/contracts/token/ERC20/StandardToken.sol";

contract MyUpgradeableToken is MigratableERC20, StandardToken, DetailedERC20 {

  function initialize(ERC20 _legacyToken, string _name, string _symbol, uint8 _decimals)
  isInitializer("MyUpgradeableToken", "1.0.0")
  public
  {
    MigratableERC20.initialize(_legacyToken);
    DetailedERC20.initialize(_name, _symbol, _decimals);
  }

  function _mint(address _to, uint256 _amount) internal {
    require(_to != address(0));
    totalSupply_ = totalSupply_.add(_amount);
    balances[_to] = balances[_to].add(_amount);
    emit Transfer(address(0), _to, _amount);
  }
}
```

On one hand, we are inheriting from the `MigratableERC20` contract provided by the OpenZeppelin EVM package which provides
all the migration functionality we will need. The `MigratableERC20` contract requires the implementation to define an
internal minting function. In this case we are defining one following the `StandardToken` contract. However, this
function will be provided built-in in the upcoming version of OpenZeppelin.

On the other hand, it is very important to replicate all the information and functionality that was provided by the
legacy token. In this case, we are inheriting from the `StandardToken` contract provided by the OpenZeppelin EVM package to
replicate all the functionality of an ERC20 token. And additionally, we are defining an initializer to handle the
token metadata.

_Initializers are the way to define constructor functionality for upgradeable contracts in ZeppelinOS. The `isInitializer`
modifier will make sure your `initialize` method can only be called once in the whole lifetime of your contract. To
read more about this, please go to the [following section](advanced.html#initializers-vs-constructors)_

Notice that all the contracts from `openzeppelin-zos` have been adapted for ZeppelinOS compatibility, and should be the
ones used when dealing with upgradeable contracts.

Besides allowing us to build upgradeable applications, ZeppelinOS provides EVM packages. To use an EVM package
in our project, we simply need to use the `link` command giving the name of the npm package of the EVM package we want to use.
In this case, we will link OpenZeppelin EVM package to be able to use the contracts it provides in our project:

```console
zos link openzeppelin-zos@1.9.1
```

Finally we can add our upgradeable token contract to the project:

```console
zos add MyUpgradeableToken
```

Great, our project has been linked to the OpenZeppelin EVM package and our `MyUpgradeableToken` has been added.

### 2. Deploy the upgradeable token

The first thing we have to do is to deploy our contract source code. We will also need to deploy a copy of the
OpenZeppelin EVM package since we will be working on a local environment. To do so, run the following command:

```console
zos push -n local --deploy-libs
```

We have just deployed the `MyUpgradeableToken` source code and the OpenZeppelin EVM package to the `local` network. A new
`zos.local.json` file should have been created.

Now, let's create a new instance of the upgradeable token using ZeppelinOS. Run the following line, replacing
`LEGACY_TOKEN_ADDRESS` with the address of the legacy token contract:

```console
zos create MyUpgradeableToken --args LEGACY_TOKEN_ADDRESS -n local
```

Save the upgradeable token address outputted by this command, we will need it later.

Note that the `proxies` section of `zos.local.json` should now include the following, as ZeppelinOS is tracking the
proxy we have just created:
```json
{
  ...,
  "proxies": {
    "MyUpgradeableToken": [
      {
        "address": "0x...",
        "version": "1.0.0",
        "implementation": "0x..."
      }
    ]
  },
  ...
}
```

### 3. Migrate your old token balance

In order to migrate your balance, go back to the truffle develop console if you have deployed your legacy token locally
or open a new one against the network where your legacy token is deployed. Then, run the following commands, replacing
`UPGRADEABLE_TOKEN_ADDRESS` with the proxy address returned by `zos create` command of the previous step:

```console
truffle(develop)> upgradeableToken = MyUpgradeableToken.at('UPGRADEABLE_TOKEN_ADDRESS')
truffle(develop)> legacyToken.balanceOf(owner).then(b => balance = b)
truffle(develop)> legacyToken.approve(upgradeableToken.address, balance, { from: owner })
truffle(develop)> upgradeableToken.migrate({ from: owner })
```

We can now check your balance of the legacy token:
```console
truffle(develop)> legacyToken.balanceOf(owner)
BigNumber { s: 1, e: 0, c: [ 0 ] }
```

Also the burned balance:

```console
truffle(develop)> legacyToken.balanceOf('0x000000000000000000000000000000000000dead')
BigNumber { s: 1, e: 0, c: [ 100 ] }
```

And the upgradeable token balance:

```console
truffle(develop)> upgradeableToken.balanceOf(owner)
BigNumber { s: 1, e: 0, c: [ 100 ] }
```

Your legacy token has been migrated to an upgradeable token!
