---
id: building
title: Building an upgradeable application
sidebar_label: Building an upgradeable app
---

After installing `zos` and setting up our ZeppelinOS project as described in the [setup](setup.md) guide, we are ready to create our upgradeable application.

Let's start by installing the [ZeppelinOS lib](https://github.com/zeppelinos/zos-lib):

```sh
npm install zos-lib
```

Next, we will create a file named `MyContract.sol` in the `contracts/` folder of our app with the following Solidity code:

```sol
import "zos-lib/contracts/migrations/Migratable.sol";

contract MyContract is Migratable {
  uint256 public x;

  function initialize(uint256 _x) isInitializer("MyContract", "0") public {
    x = _x;
  }
}
```

Notice that our sample contract has an `initialize` function instead of the standard constructor. This is a requirement of [ZeppelinOS's upgradeability system](advanced.md#initializers-vs-constructors).

Before deploying our app, we need to register the first version of our contract:

```sh
zos add MyContract
```

Note that the `add` command of the ZeppelinOS CLI also compiles the contracts, but you can always compile them manually using `npx truffle compile`. 


## Initial deployment

The `zos init` command already sets up a [Truffle configuration file](http://truffleframework.com/docs/getting_started/project#alternative-migrating-with-ganache), so you can start a local development network simply by: 

```sh
npx truffle develop
```

We can now push our application to this network by running:

```sh
zos push --network local
```

This will create a `zos.local.json` file with all the information specific to this network. You can read more about this file in the [advanced topics](advanced.md#format-of-zosjson-and-zos-network-json-files) section. If you want to work with a different network, simply substitute the `local` parameter for `ropsten`, `rinkeby` or `mainnet`. 

To create an upgradeable version of our contract, we need to run:

```sh
zos create MyContract --init initialize --args 42 --network local
```

The `create` command takes an optional `--init` flag to call the initialization function after creating the contract, while the `--args` flag allows us to pass arguments to it. This way, we are initializing our contract with `42` as the value of the `x` state variable.

> **Note**: When calling an initializer with many variables, these should be passed as a comma-separated list, with no spaces in between. This also applies when passing arrays as arguments. 

After these simple steps, our upgradeable application is now on-chain!

## Upgrading our contract

If, at a later stage, we want to upgrade our smart contract's code in order to fix a bug or add a new feature, we can do it seamlessly using ZeppelinOS.

> **Note**: while ZeppelinOS supports arbitrary changes in functionality, you will need to preserve all variables that appear in prior versions of your contracts, declaring any new variables below the already existing ones. You can find details on this in the [advanced topics](advanced.md) page. 

Once we have made the desired changes to our contracts, we need to push them to the network:

```sh
zos push --network local
```

Finally, let's upgrade the already deployed contract:

```sh
zos upgrade MyContract --network local
```

_Voilà!_ We have deployed and upgraded an application using ZeppelinOS. The address of the upgraded contract is the same as before, but the code has been updated to the new version.

In order to use the ZeppelinOS standard libraries in an upgradeable app, please follow our [next guide](using.md).
