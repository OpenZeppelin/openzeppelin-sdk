---
id: advanced
title: Advanced topics
---

We expand on several advanced topics for the more intrepid users of ZeppelinOS.

## Deploying to mainnet
The [Building upgradeable applications](building.md) guide explains how to
deploy an application to a local network, which is very good for testing.
Once you are happy with your initial contracts, you can deploy them to mainnet
using the `--network` flag.

This flag takes the network details from the Truffle configuration file. You
can use Infura to connect to mainnet, with a `truffle-config.js` like this one:

```
'use strict';

var HDWalletProvider = require("truffle-hdwallet-provider");

var mnemonic = "orange apple banana ... ";

module.exports = {
  networks: {
    mainnet: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "https://mainnet.infura.io/<INFURA_Access_Token>")
      },
      network_id: 1
    }
  }
};
```

Make sure to replace the `mnemonic` with the one you used to generate your
accounts, and change `<INFURA_Access_Token>` to your token.

Install the `truffle-hdwallet-provider` module with:

```
npm install truffle-hdwallet-provider
```

And now you can run `zos` commands in mainnet. For example:

```
zos push --network mainnet
```

This will use your first account generated from the mnemonic. If you want to
specify a different account, use the `--from` flag.

Here you will find a
[guide with more details about configuring Truffle to use Infura](http://truffleframework.com/tutorials/using-infura-custom-provider).
You can use other test networks like ropsten to further test your contracts
before pushing them to mainnet. But remember that now your contracts are
upgradeable! Even if you find a bug after deploying them to mainnet, you will
be able to fix it without losing the contract state and in a way that's
transparent for your users.

#### Calling Initialize Functions Manually in Your Unit Tests

Truffle does not know how to resolve situations where a contract has functions that have matching names, but different arities. Here's an example of a `TimedCrowdsale` contract that inherits from `Crowdsale` which results in a contract that has two `initialize` functions with different arities:

```
contract TimedCrowdsale is Crowdsale {

  initialize(uint256 _openingTime, uint256 _closingTime)
    public
    isInitializer("TimedCrowdsale", "0.0.1")
  {
    Crowdsale.initialize(_rate, _wallet, _token);
  }
}

contract Crowdsale {

  initialize(uint256 _rate, address _wallet, ERC20 _token)
    public
    isInitializer("Crowdsale", "0.0.1")
  {
    // does something
  }
}
```

This means that calls to contracts with more than one function named `initialize`, as is the case with some contracts from OpenZeppelin (e.g., TimedCrowdsale), may revert if you call `initialize` directly from Truffle. `zos create` handles this correctly as it encodes the parameters. However, for your unit tests you will need to call `initialize` manually.

The current solution to this issue is to `npm install zos-lib` and use the same helper function `zos create` uses: `encodeCall`. `encodeCall` receives the signature of your `initialize` function, as well as its arguments and their types. It then crafts the calldata which you can send in a raw call. Here's an example:

```
data = encodeCall(
    "initialize",
    ['address', 'string', 'string', 'uint8', 'address'],
    [owner, name, symbol, decimals, exampleToken.address]
);

await exampleToken.sendTransaction( {data, from: owner} );
```
## Safety checks

The ZeppelinOS CLI performs a series of safety checks in some of its commands with the purpose of strengthening the security of your projects. For example, the `zos add` command can detect if a contract has a `constructor`, or contains usages of `selfdestruct` or `delegatecall`. Below is a list of some of the checks made, along with the reasoning behind why they are considered to be security risks.

**Some validation examples:**
* constructor check: Proxied contracts should use initializer functions instead of constructors. For more info, see [Initializers vs. constructors](https://docs.zeppelinos.org/docs/advanced.html#initializers-vs-constructors) in this page.
* selfdestruct check: Solidity's `selfdestruct` keyword ends the execution of a contract, destroys it, and sends all of its funds to a specified account. This is a very delicate action to take, and can expose a contract to vulnerabilities such as the [second Parity Wallet hack](https://blog.zeppelinos.org/parity-wallet-hack-reloaded/). It should be used with extreme care.
* delegatecall check: The `delegatecall` keyword fully exposes a contract's state to a 3rd party contract. Such a contract has complete control on the calling contract. It should only be used if you really know [hat you're doing.

When such validation checks fail, the ZeppelinOS CLI will not performs any actions unless the `--force` option is used. If so, the CLI will perform the actions and try to remember your choice in future occasions.

## Format of `zos.json` and `zos.<network>.json` files
ZeppelinOS's CLI generates `json` files where it stores the configuration of your project.


### `zos.json`
The first file stores the general configuration and is created by the `zos init` command. It has the following structure:

```json
{
  "name": <projectName>
  "version": <version>
  "contracts": {
    <contract-1-alias>: <contract-1-name>,
    <contract-2-alias>: <contract-2-name>,
    ...
    <contract-N-alias>: <contract-N-name>
  },
  "stdlib": {
    "name": <stdlibName>
  }
}
```

Here, `<projectName>` is the name of the project, and `<version>` is the current version number. Once you start adding your contracts via `zos add`, they will be recorded under the `"contracts"` field, with the contract aliases as the keys (which default to the contract names), and the contract names as the values. Finally, if you link an `stdlib` with `zos link`, this will be reflected in the `"stdlib"` field, where `<stdlibName>` is the name of the linked `EVM package`.


### `zos.<network>.json`
ZeppelinOS will also generate a file for each of the networks you work on (`local`, `ropsten`, `live`, ... These should be configured [in your `truffle.js` file](http://truffleframework.com/docs/advanced/configuration#networks), but note that `zos init` already configures the `local` network, which can be run by `npx truffle develop`). These files share the same structure:

```json
{
  "contracts": {
    <contract-1-name>: {
      "address": <contract-1-address>,
      "bytecodeHash": <contract-1-hash>
    },
    <contract-2-name>: {
      "address": <contract-2-address>,
      "bytecodeHash": <contract-2-hash>
    },
    ...
    <contract-N-name>: {
      "address": <contract-N-address>,
      "bytecodeHash": <contract-N-hash>
    }
  },
  "proxies": {
    <contract-1-name>: [
        {
          "address": <proxy-1-address>,
          "version": <proxy-1-version>,
          "implementation": <implementation-1-address>
        }
      ],
      <contract-2-name>: [
        {
          "address": <proxy-2-address>,
          "version": <proxy-2-version>,
          "implementation": <implementation-2-address>
        }
      ],
      ...
      <contract-N-name>: [
        {
          "address": <proxy-N-address>,
          "version": <proxy-N-version>,
          "implementation": <implementation-N-address>
        }
      ]
  },
  "app": {
    "address": <app-address>
  },
  "version": <app-version>,
  "package": {
    "address": <package-address>
  },
  "provider": {
    "address": <provider-address>
  },
  "stdlib": {
    "address": <stdlib-address>,
    ["customDeploy": <custom-deploy>]
    "name": <stdlib-name>
  }
}
```

The most important thing to see here are the proxies and contracts' addresses, `<proxy-i-address>` and `<contract-i-address>` respectively. What will happen is that each time you upgrade your contracts, `<contract-i-address>` will change, reflecting the underlying logic contract change. The proxy addresses, however, will stay the same, so you can interact seamlessly with the same addresses as if no change had taken place. Note that `<implementation-i-address>` will normally point to the current contract address `<contract-i-address>`. Finally, `<contract-i-hash>` stores a SHA256 hash of the contract bytecode.

Another thing to notice in these files are the version numbers. The `<appVersion>` keeps track of the latest app version, and matches `<version>` from `zos.json`. The `<proxy-i-version>`s, on the other hand, keep track of which version of the contracts the proxies are pointing to. Say you deploy a contract in your app version 1.0, and then bump the version to 1.1 and push some upgraded code for that same contract. This will be reflected in the `<contract-i-address>`, but not yet in the proxy, which will display 1.0 in `<proxy-i-version>` and the old logic contract address in `<implementation-i-address>`. Once you run `zos update` to your contract, `<proxy-i-version>` will show the new 1.1 version, and `<implementation-i-address>` will point to the new `<contract-i-address>`.

Also, notice the fields `<app>` and `<package>`. These contain the addresses of contracts that ZeppelinOS uses to facilitate the creation of proxies and the management of different versions of your contracts. These contracts will only be deployed once you publish your project to a desired network. That is, your project will not have an `app` or `package` unless explicitly running the `publish` command. Note that this step is required for projects that produce an EVM package. To read more about the architecture of contracts we are using to publish your project on-chain please refer to the [Contract Architecture](https://docs.zeppelinos.org/docs/architecture.html) section.

Finally, the `stdlib` field stores information about linked EVM packages. Its address is stored in `<stdlib-address>`, and its name in `<stdlib-name>`, matching that in `zos.json`. The `custom-deploy` field will be present only when a version of the EVM package is deployed using the `--deploy-libs` flag of the `push` command, in which case `<custom-deploy>` will be `true`. The remaining addresses, `<app-address>`, `<package-address>`, and `<provider-address>` store the addresses of the `App`, the `Package`, and the current `ImplementationProvider` respectively.
