---
id: advanced
title: Advanced topics
---

We expand on several advanced topics for the more intrepid users of ZeppelinOS. 

## The proxy system
The upgradeability system in ZeppelinOS is based on a proxy system: for each deployed contract (the _implementation_), another, user-facing contract is deployed as well (the _proxy_). The proxy will be the one in charge of the contract's storage, but will forward all function calls to the backing implementation. The only exception to this are calls made by the owner of the proxy for administrative purposes, which will be handled by the proxy itself. 

The way the proxy forwards calls to the implementation relies on [`delegatecall`](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-7.md), the mechanism the EVM provides to execute foreign code on local storage. This is normally used for libraries such as [`SafeMath`](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/math/SafeMath.sol), which provide useful functionality but have no storage. ZeppelinOS, however, exploits this mechanism to provide upgradeability: a user only interacts with the proxy, and, when a new implementation is available, the proxy owner simply points it to the upgraded contract. All of this is achieved in a way that is transparent for the user, as the proxy address is always the same.

If you want to find out more about different possible proxy patterns, be sure to check [this post](https://blog.zeppelinos.org/proxy-patterns/).



## Preserving the storage structure
As mentioned in the [Building upgradeable applications](building.md) guide, when upgrading your contracts, you need to make sure that all variables declared in prior versions are kept in the code. New variables must be declared below the previously existing ones, as such:

```sol
contract MyContract_v1 {
  uint256 public x;
}

contract MyContract_v2 {
  uint256 public x;
  uint256 public y;
}
```

Note that this must be so _even if you no longer use the variables_. There is no restriction (apart from gas limits) on including new variables in the upgraded versions of your contracts, or on removing or adding functions. 

This necessity is due to how [Solidity uses the storage space](https://solidity.readthedocs.io/en/v0.4.21/miscellaneous.html#layout-of-state-variables-in-storage). In short, the variables are allocated storage space in the order they appear (for the whole variable or some pointer to the actual storage slot, in the case of dynamically sized variables). When we upgrade a contract, its storage contents are preserved. This entails that if we remove variables, the new ones will be assigned storage space that is already occupied by the old variables; all we would achieve is losing the pointers to that space, with no guarantees on its content.

## Initializers vs. constructors
As we saw in the [Building upgradeable applications](building.md) guide, we did not include a constructor in our contracts, but used instead an `initialize` function. The reason for this is that constructors do not work as regular functions: they are invoked once upon a contract's creation, but their code is never stored in the blockchain. This means that they cannot be called from the contract's proxy as we call other functions. Thus, if we want to initialize variables in the _proxy's storage_, we need to include a regular function for doing so. 

The ZeppelinOS CLI provides a way for calling this function and passing it the necessary arguments when creating the proxy:

```    
zos create MyContract --init <initializingFunction> --args <arguments> --network <network>
```

where `<initializingFunction>` is the name of the initializing function (marked with an `isInitializer` modifier in the code), and `<arguments>` is a comma-separated list of arguments to the function. 

## Format of `zos.json` and `zos.<network>.json` files
ZeppelinOS's CLI generates `json` files where it stores the configuration of your project.

### `zos.json`
The first file stores the general configuration and is created by the `zos init` command. It has the following structure:

```json    
{
  "name": <projectName>
  "version": <version>
  "contracts": {
    <contract1Alias>: <contract1Name>,
    <contract2Alias>: <contract2Name>,
    ...
    <contractNAlias>: <contractNName>
  },
  "stdlib": {
    "name": <stdlibName>
  }
}
```

Here, `<projectName>` is the name of the project, and `<version>` is the current version name or number. Once you start adding your contracts via `zos add`, they will be recorded under the `"contracts"` field, with `<contractiAlias>` the aliases (which default to the contract names, and `i` goes from `1` to `N`), and `<contractiName>` the names. Finally, if you link an `stdlib` with `zos link`, this will be reflected in the `"stdlib"` field, where `<stdlibName>` is the name of the linked `stdlib`. 

### `zos.<network>.json`
ZeppelinOS will also generate a file for each of the networks you work in (`local`, `ropsten`, `live`, ... These should be configured [in your `truffle.js` file](http://truffleframework.com/docs/advanced/configuration#networks), but note that `zos init` already configures the `local` network, which can be run by `npx truffle develop`). These files share the same structure:

```json
{
  "contracts": {
    <contract1Name>: {
      "address": <contract1Address>,
      "bytecodeHash": <contract1Hash>
    },
    <contract2Name>: {
      "address": <contract2Address>,
      "bytecodeHash": <contract2Hash>
    },
    ...
    <contractNName>: {
      "address": <contractNAddress>,
      "bytecodeHash": <contractNHash>
    }
  },
  "proxies": { 
    <contract1Name>: [
        {
          "address": <proxy1Address>,
          "version": <proxy1Version>,
          "implementation": <implementation1Address>
        }
      ],
      <contract2Name>: [
        {
          "address": <proxy2Address>,
          "version": <proxy2Version>,
          "implementation": <implementation2Address>
        }
      ],
      ...
      <contractNName>: [
        {
          "address": <proxyNAddress>,
          "version": <proxyNVersion>,
          "implementation": <implementationNAddress>
        }
      ]
  }, 
  "app": {
    "address": <appAddress>
  },
  "version": <appVersion>,
  "package": {
    "address": <packageAddress>
  },
  "provider": {
    "address": <providerAddress>
  },
  "stdlib": {
    "address": <stdlibAddress>,
    ["customDeploy": <customDeploy>,]
    "name": <stdlibName>
  }
}
```

The most important thing to see here are the proxies and contracts' addresses, `<proxyiAddress>` and `<contractiAddress>` respectively. What will happen is that each time you upgrade your contracts, `<contractiAddress>` will change, reflecting the underlying implementation change. The proxy addresses, however, will stay the same, so you can interact seamlessly with the same addresses as if no change had taken place. Note that `<implementationiAddress>` will normally point to the current contract address `<contractiAddress>`. Finally, `<contractiHash>` stores a SHA256 hash of the contract bytecode. 

The other thing to notice in these files are the version numbers (or names!). The `<appVersion>` keeps track of the latest app version, and matches `<version>` from `zos.json`. The `<proxyiVersion>`s, on the other hand, keep track of which version of the contracts the proxies are pointing to. Say you deploy a contract in your app version 0.0, and then bump the version to 0.1 and push some upgraded code for that same contract. This will be reflected in the `<contractiAddress>`, but not yet in the proxy, which will display 0.0 in `<proxyiVersion>` and the old contract implementation address in `<implementationiAddress>`. Once you run `zos upgrade` to your contract, `<proxyiVersion>` will show the new 0.1 version, and `<implementationiAddress>` will point to the new `<contractiAddress>`.

Finally, the `stdlib` field stores information about a linked standard library. Its address is stored in `<stdlibAddress>`, and its name in `<stdlibName>`, matching that in `zos.json`. The `customDeploy` field will be present only when a version of the stdlib is deployed using the `--deploy-stdlib` flag of the `push` command, in which case `<customDeploy>` will be `true`. The remaining addresses, `<appAddress>`, `<packageAddress>`, and `<providerAddress>` store the addresses of the `App`, the `Package`, and the current `ContractProvider` respectively. 



