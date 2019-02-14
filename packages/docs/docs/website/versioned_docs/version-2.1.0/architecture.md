---
id: version-2.1.0-architecture
title: Contracts Architecture
original_id: architecture
---

ZeppelinOS's features such as upgrades, EVM package linking, and vouching, can all be used through the `zos` CLI without extra contracts. However, some additional smart contracts get into play when you want to publish your EVM package for others to reuse, calling:

```console
zos publish
```

When publishing, your ZeppelinOS project will be backed by a set of smart contracts whose source can be found in [zos/packages/lib/contracts/application](https://github.com/zeppelinos/zos/tree/master/packages/lib/contracts/application). In the following sections, we describe the general architecture of a ZeppelinOS published EVM package.

## [App.sol](https://github.com/zeppelinos/zos/blob/v2.0.0/packages/lib/contracts/application/App.sol)

The App contract is the project's main entry point. Its most important function is to manage your project's "providers". A provider is basically an EVM package identified by a name at a specific version. For example, a project may track your application's contracts in one provider named "my-application" at version "0.0.1", an OpenZeppelin provider named "openzeppelin-eth" at version "2.0.0", and a few other providers. These providers are your project's sources of on-chain logic.

The providers are mapped by name to `ProviderInfo` structs:

#### App.sol
```solidity

  //...

  mapping(string => ProviderInfo) internal providers;

  // ...

  struct ProviderInfo {
    Package package;
    uint64[3] version;
  }

  // ...
```

When you upgrade one of your application's smart contracts, it is your application provider named "my-application" that is bumped to a new version, e.g. from "0.0.1" to "0.0.2". On the other hand, when you decide to use a new version of the OpenZeppelin EVM package in your project, it is the "openzeppelin-eth" provider which is now pointed at the "2.0.1" version of the package, instead of "2.0.0".

An EVM package is defined by the `Package` contract, as we'll see next.

NOTE: Additionally the `App` contract also facilitates the creation of proxies, by conveniently wrapping around the `AdminUpgradeabilityProxy` contract. For more info on direct usage of proxies, please see [the low level usage section](https://docs.zeppelinos.org/docs/low_level_contract.html).

## [Package.sol](https://github.com/zeppelinos/zos/blob/v2.0.0/packages/lib/contracts/application/Package.sol)

A `Package` contract tracks all the versions of a given EVM package. Following the example above, one package could be the "application package" associated to the name "my-application" containing all the contracts for version "0.0.1" of your application, and all the contracts for version "0.0.2" as well. Alternatively, another package could be an EVM package associated to the name "openzeppelin-eth" which contains a large number of versions "x.y.z" each of which contains a given set of contracts.

The versions are mapped by a semver hash to `Version` structs:

#### Package.sol
```solidity

  // ..

  mapping (bytes32 => Version) internal versions;

  // ..

  struct Version {
    uint64[3] semanticVersion;
    address contractAddress;
    bytes contentURI;
  }

  // ..
```

## [ImplementationDirectory](https://github.com/zeppelinos/zos/blob/v2.0.0/packages/lib/contracts/application/ImplementationDirectory.sol)

A version's `contractAddress` is an instance of the `ImplementationDirectory` contract, which is basically a mapping of contract aliases (or names) to deployed implementation instances. Continuing the example, your project's "my-application" package for version "0.0.1" could contain a directory with the following contracts:

**Directory for version "0.0.1" of the "my-application" package**
* Alias: "MainContract", Implementation: "0x0B06339ad63A875D4874dB7B7C921012BbFfe943"
* Alias: "MyToken", Implementation: "0x1b9a62585255981c85Acec022cDaC701132884f7"

While version "0.0.2" of the "my-application" package could look like this:

**Directory for version "0.0.2" of the "my-application" package**
* Alias: "MainContract", Implementation: "0x0B06339ad63A875D4874dB7B7C921012BbFfe943"
* Alias: "MyToken", Implementation: "0x724a43099d375e36c07be60c967b8bbbec985dc8" <--- this changed

Notice how version "0.0.2" uses a new implementation for the "MyToken" contract.

Likewise, different versions of the "openzeppelin-eth" EVM package could contain different implementations for persisting aliases such as "ERC20", "ERC721", etc.

An `ImplementationDirectory` is a contract that adopts the `ImplemetationProvider` interface, which simply requires that for a given contract alias or name, the deployed address of a contract is provided. In this particular implementation of the interface, an `ImplementationDirectory` can be frozen, indicating that it will no longer be able to set or unset additional contracts and aliases.
This is helpful for making official releases of EVM packages, where the immutability of the package is guaranteed.

Other implementations of the interface could provide contracts without such a limitation, which makes the architecture pretty flexible, yet secure.

## Overview

The following diagram illustrates the interface of the contracts of published EVM packages:

![ZeppelinOS 2.x UML](/img/zos2.png)
