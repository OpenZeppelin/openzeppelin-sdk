---
id: version-1.0.0-building
title: Building an upgradeable application
sidebar_label: Building an upgradeable app
original_id: building
---

After installing `zos` and setting up your ZeppelinOS project as described in the [setup](setup.html) guide, you are now ready to create your upgradeable application.

Let's start by installing the [ZeppelinOS lib](https://github.com/zeppelinos/zos-lib), which you will need to make your contract code upgradeable.

```sh
npm install zos-lib
```

Next, let's create a file named `MyContract.sol` in the `contracts/` folder with the following Solidity code:

```js
pragma solidity ^0.4.21;
import "zos-lib/contracts/migrations/Migratable.sol";

contract MyContract is Migratable {
  uint256 public x;

  function initialize(uint256 _x) isInitializer("MyContract", "0") public {
    x = _x;
  }
}
```

Notice that your sample contract has an `initialize` function instead of the standard constructor. This is a requirement of [ZeppelinOS initializer functions](proxies.md#the-constructor-caveat).

Before deploying your upgradeable app to the network, you need to add your contract:

```sh
zos add MyContract
```

Note that the `add` command compiles the contracts before adding them to your app, but you can always compile them manually using `npx truffle compile`.


## Initial deployment

The `zos init` command creates a [Truffle configuration file](http://truffleframework.com/docs/getting_started/project#alternative-migrating-with-ganache) for you. If you want to use the provided 'local' development network, run your development node on port 9545 (For example `npx ganache-cli --port 9545`).

You can now push your application to this network:

```sh
zos push --network local
```

This creates a `zos.local.json` file with all the information about your app in this specific network. You can read more about this file format in the [advanced topics](advanced.md#format-of-zosjson-and-zos-network-json-files) section. If you want to work with a different network, simply substitute the `local` parameter for `ropsten`, `rinkeby` or `mainnet` in the `zos push` command.

To create an upgradeable instance of your contract, you can run:

```sh
zos create MyContract --init initialize --args 42 --network local
```

The `create` command receives an optional `--init` parameter to call the initialization function after creating the contract, while the `--args` parameter allows you to pass arguments to it. This way, you are initializing your contract with `42` as the value of the `x` state variable.

> **Note**: When calling an initializer with many variables, these should be passed as a comma-separated list, with no spaces in between.

After these simple steps, your upgradeable application is now on-chain! Congratulations!

## Upgrading your contract

If, at a later stage, you want to upgrade your smart contract code in order to fix a bug or add a new feature, you can do it seamlessly using ZeppelinOS. Remember not to restart your development node, or you will lose your previous deployment!

> **Note**: while ZeppelinOS supports arbitrary changes in functionality, you will need to preserve all variables that appear in prior versions of your contracts, declaring any new variables below the already existing ones. You can find more details in the [advanced topics](advanced.html) page.

Open `MyContract.sol` again, and add a new function:
```js
import "zos-lib/contracts/migrations/Migratable.sol";

contract MyContract is Migratable {
  uint256 public x;

  function initialize(uint256 _x) isInitializer("MyContract", "0") public {
    x = _x;
  }

  function increment() public {
    x += 1;  
  }
}
```


Once you have saved the changes in your contract files, simply push the new code to the network:

```sh
zos push --network local
```

Finally, let's update the already deployed contract with the new code:

```sh
zos update MyContract --network local
```
This command outputs the address of your upgradeable MyContract instance (in white).

_Voilà!_ You have deployed and upgraded an application using ZeppelinOS. The address of the upgraded contract is the same as before, but the code has been updated to the new version.

To try the upgraded feature we just added, run:
```sh
npx truffle console --network=local
truffle(local)> myContract = MyContract.at(<your-proxy-address>)
truffle(local)> myContract.increment()
truffle(local)> myContract.x()
43
```

In order to learn how to use the ZeppelinOS standard libraries in an upgradeable app, please follow the [next guide](using.html).
