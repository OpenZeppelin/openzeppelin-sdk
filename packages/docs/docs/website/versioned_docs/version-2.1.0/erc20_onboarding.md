---
id: version-2.1.0-erc20_onboarding
title: Onboarding ERC20 tokens
original_id: erc20_onboarding
---

## Intro
This guide covers the migration of a regular ERC20 token to an upgradeable version of itself. During this process, the
original contract (to be called "legacy") and the new contract, which will have the ability of being upgraded, will coexist.

The _new upgradable contract_ will have the same functionality provided by the _legacy_ contract, but it will be
*upgradable*. This means that we will be able to add new functionality, store new data, fix bugs or support new
standards as many times as we need, without any need to perform new migrations in the future.

## Strategy

This strategy is based on an optional migration of the token balances. This migration is performed and paid by the
token holders. The new upgradeable token contract starts with no initial supply and no balances. The only way to "mint"
the new tokens is for users to "turn in" their old ones. This is done by first approving the amount they want to migrate,
and then calling a function of the upgradeable token to carry out the migration. The old tokens are sent to a burn
address, and the holder receives an equal amount in the new token contract.

## Requirements

This on-boarding plan considers the following assumptions:
- There is an already deployed token contract that follows the ERC20 standard.
- The legacy token contract is not frozen or paused, so token holders can trade it.

## Onboarding plan demo

The central idea of this proposal is to deploy an upgradeable version of your token, using the ZeppelinOS command line
tool. Additionally, we will use the [`ERC20Migrator`](https://github.com/OpenZeppelin/openzeppelin-eth/blob/v2.0.0/contracts/drafts/ERC20Migrator.sol)
contract provided by `openzeppelin-eth`, the [OpenZeppelin EVM package for ZeppelinOS](https://github.com/OpenZeppelin/openzeppelin-eth/).

To better describe this plan we will use a sample project you can follow and clone from [here](https://github.com/zeppelinos/erc20-onboarding/tree/zos-2.1).

We will now setup a local environment to demo the onboarding plan. To do this, we will deploy a sample legacy token
contract and mint some balances. If you wish to work with your already deployed token, you can skip the following lines
and jump directly to the [step 1](erc20_onboarding.html#1-initialize-your-migration-project-with-zeppelinos).

In the sample repository you will find a contract called [`MyLegacyToken`](https://github.com/zeppelinos/erc20-onboarding/blob/master/contracts/MyLegacyToken.sol)
that we will use to simulate a real scenario locally. As you can see, this token will mint 100 tokens to the owner once
initialized just for testing purposes.

_Before we begin, remember to install the dependencies running `npm install`. Additionally, you should check that everything
is working as expected by compiling the contracts with `npx truffle compile` and then running the test files with `npm test`._

Now, let's deploy the legacy token. We will use [ganache-cli](https://truffleframework.com/docs/ganache/quickstart), a
personal blockchain for Ethereum development that you can use to deploy your contracts and develop your applications.
To start using it, run the following command:

```console
npx ganache-cli --port 9545
```

After that, you will be able to attach a truffle console to an already configured network inside the `truffle-config.js` 
by running:

```console
npx truffle console --network local
```

Then, run the following commands:

```console
truffle(local)> compile
truffle(local)> owner = web3.eth.accounts[1]
truffle(local)> MyLegacyToken.new({ from: owner }).then(i => legacyToken = i)
truffle(local)> legacyToken.address
'0x...'
```

Keep track of the `owner` and `legacyToken` addresses, we will need them in the following steps.

You can check the owner balance by running:

```console
truffle(local)> legacyToken.balanceOf(owner)
BigNumber { s: 1, e: 22, c: [ 100000000 ] }
```

Remember not to close this console, as we will be using it later.

### 1. Initialize your migration project with ZeppelinOS

To initialize this project with ZeppelinOS, open a terminal and run the following line:

```console
npx zos init my-token-migration 1.0.0
```

We have just initialized a new ZeppelinOS project. A new `zos.json` file should have been created.

Next, we will have to modify the legacy token contract to get the new upgradeable version of it where the current balances
are going to be migrated.

In our sample project, you will find another contract called [`MyUpgradeableToken`](https://github.com/zeppelinos/erc20-onboarding/blob/master/contracts/MyUpgradeableToken.sol)
which will be the upgradeable version of the sample legacy token contract [`MyLegacyToken`](https://github.com/zeppelinos/erc20-onboarding/blob/master/contracts/MyLegacyToken.sol):

```solidity
pragma solidity ^0.4.24;

import "zos-lib/contracts/Initializable.sol";
import "openzeppelin-eth/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-eth/contracts/drafts/ERC20Migrator.sol";
import "openzeppelin-eth/contracts/token/ERC20/ERC20Mintable.sol";
import "openzeppelin-eth/contracts/token/ERC20/ERC20Detailed.sol";

contract MyUpgradeableToken is Initializable, ERC20, ERC20Detailed, ERC20Mintable {

  function initialize(ERC20Detailed _legacyToken, ERC20Migrator _migrator) initializer public {
    ERC20Mintable.initialize(_migrator);
    ERC20Detailed.initialize(_legacyToken.name(), _legacyToken.symbol(), _legacyToken.decimals());
    _migrator.beginMigration(this);
  }

}
```

On one hand, it is very important to replicate all the information and functionality that was provided by the
legacy token. In this case, we are inheriting from the `ERC20` and `ERC20Detailed` contracts provided by the
OpenZeppelin EVM package to replicate all the functionality of an ERC20 token.

On the other hand, we are defining an `initialize` method that receives an `ERC20Migrator` instance that will take care
of all the migration functionality we will need. To work with `ERC20Migrator`, your upgradeable token has to be
mintable, that's why we are also inheriting from the `ERC20Mintable` contract provided by the OpenZeppelin EVM
package as well.

_Initializers are the way to define constructor functionality for upgradeable contracts in ZeppelinOS. The `initializer`
modifier will make sure your `initialize` method can only be called once in the whole lifetime of your contract._

Notice that all the contracts from `openzeppelin-eth` have been adapted for ZeppelinOS compatibility, and should be the
ones used when dealing with upgradeable contracts.

Besides allowing us to build upgradeable applications, ZeppelinOS provides EVM packages. To use an EVM package
in our project, we simply need to use the `link` command giving the name of the npm package of the EVM package we want
to use. In this case, we will link OpenZeppelin EVM package to be able to use the contracts it provides in our project:

```console
npx zos link openzeppelin-eth@^2.0.2
```

Finally we can add our upgradeable token contract to the project:

```console
npx zos add MyUpgradeableToken
```

Great, our project has been linked to the OpenZeppelin EVM package and our `MyUpgradeableToken` has been added.

### 2. Deploy the upgradeable token

The first thing we have to do is to deploy our contract source code. We will also need to deploy a copy of the
OpenZeppelin EVM package since we will be working on a local environment. To do so, run the following command:

```console
npx zos push -n local --deploy-dependencies
```

_Note that we are using the `--deploy-dependencies` to deploy the OpenZeppelin EVM package locally, since it is not
deployed in our local blockchain yet._

We have just deployed the `MyUpgradeableToken` source code and the OpenZeppelin EVM package to the `local` network. A
new `zos.dev-<network_id>.json` file should have been created.

Now, let's create a new instance of the upgradeable token using ZeppelinOS. To do so, we will need to create an
instance of an `ERC20Migrator` first, but given it is not yet provided by the OpenZeppelin EVM package, we will have
to add it manually. Then, run the following commands:
replacing `LEGACY_TOKEN_ADDRESS` with the address of the legacy token contract:
```console
npx zos add ERC20Migrator
npx zos push -n local --deploy-dependencies
npx zos create ERC20Migrator --args LEGACY_TOKEN_ADDRESS -n local
```

Great! We have created a new upgradeable instance using the `ERC20Migrator` contract provided by the OpenZeppelin EVM
package. Now, we can create a new upgradeable instance of our `MyUpgradeableToken` running the following command. Please
make sure you replace `LEGACY_TOKEN_ADDRESS` with the address of the legacy token contract and `ERC20_MIGRATOR_ADDRESS`
with the address of the instance you created above:

```console
npx zos create MyUpgradeableToken --args LEGACY_TOKEN_ADDRESS,ERC20_MIGRATOR_ADDRESS -n local
```

Save the upgradeable token address outputted by this command, we will need it later.

Note that the `proxies` section of `zos.dev-<network_id>.json` should now include the following, as ZeppelinOS is
tracking the upgradeable instances we have just created:

```json
{
  ...,
  "proxies": {
    "erc20-onboarding/ERC20Migrator": [
      {
        "address": "0x...",
        "version": "1.0.0",
        "implementation": "0x..."
      }
    ],
    "erc20-onboarding/MyUpgradeableToken": [
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

In order to migrate your balance, go back to the truffle console if you have deployed your legacy token locally
or open a new one against the network where your legacy token is deployed. Then, run the following commands, replacing
`ERC20_MIGRATOR_ADDRESS` and `UPGRADEABLE_TOKEN_ADDRESS` with their corresponding proxy address returned by `zos create`
commands of the previous step:

```console
truffle(local)> ERC20Migrator.at('ERC20_MIGRATOR_ADDRESS').then(i => erc20Migrator = i)
truffle(local)> MyUpgradeableToken.at('UPGRADEABLE_TOKEN_ADDRESS').then(i => upgradeableToken = i)
truffle(local)> erc20Migrator.beginMigration(upgradeableToken.address, { from: owner })
truffle(local)> legacyToken.balanceOf(owner).then(b => balance = b)
truffle(local)> legacyToken.approve(erc20Migrator.address, balance, { from: owner })
truffle(local)> erc20Migrator.migrateAll(owner, { from: owner })
```

We can now check your balance in the legacy token:
```console
truffle(local)> legacyToken.balanceOf(owner)
BigNumber { s: 1, e: 0, c: [ 0 ] }
```

Also the burned balance:

```console
truffle(local)> legacyToken.balanceOf(erc20Migrator.address)
BigNumber { s: 1, e: 22, c: [ 100000000 ] }
```

And the upgradeable token balance:

```console
truffle(local)> upgradeableToken.balanceOf(owner, { from: owner })
BigNumber { s: 1, e: 22, c: [ 100000000 ] }
```

Your legacy token has been migrated to an upgradeable token!
