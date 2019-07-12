---
id: architecture
title: Contracts Architecture
---

OpenZeppelin SDK's features such as upgrades and Ethereum Package linking can be used through the `openzeppelin` CLI with only one extra contract. The [ProxyAdmin](https://github.com/OpenZeppelin/openzeppelin-sdk/blob/v2.0.0/packages/lib/contracts/upgradeability/ProxyAdmin.sol) contract. The OpenZeppelin SDK uses this contract in order to avoid confusion around the [transparent proxy pattern](pattern#transparent-proxies-and-function-clashes). This contract acts as a central admin for all proxies on your behalf, making their management as simple as possible, while retaining the highest safety standards. 

However, some additional smart contracts come into play when you want to publish your Ethereum Package for others to reuse. Publishing is achieved by calling the command:

```console
openzeppelin publish
```

The source code of the contracts involved with a published Ethereum Package can be found in the folder [packages/lib/contracts/application](https://github.com/OpenZeppelin/openzeppelin-sdk/tree/master/packages/lib/contracts/application). In the following sections, we describe the general architecture of an OpenZeppelin published Ethereum Package.

## [ProxyAdmin.sol](https://github.com/zeppelinos/zos/blob/v2.0.0/packages/lib/contracts/application/App.sol)

This contract acts as a central admin for all proxies on your behalf, making their management as simple as possible. The ProxyAdmin contract is owned by the deployer (the project owner). It is the admin of all the proxy contracts and is in charge of upgrading them as well as transferring their ownership to another admin.

**Ownership transfer of a single contract vs complete project**

ZeppelinOS provides `set-admin` command to transfer ownership. Using this command, we can transfer ownership of any single contract or we can also transfer the ownership of our entire project just by transferring the ownership of the ProxyAdmin contract itself.

To transfer ownership of a single contract

```console
zos set-admin [MYCONTRACT_ADDRESS] [NEW_ADMIN_ADDRESS]
```
To transfer ownership of the complete project

```console
zos set-admin [NEW_ADMIN_ADDRESS]
```
>Note: Please replace [MYCONTRACT_ADDRESS] with the address of your contract for whom you want to change the ownership. Also, `zos set-admin` is an interactive command, and if you have any confusion just run `zos set-admin`, it will help you with upgrading your contracts.

**Contract upgrade using ProxyAdmin**

`ProxyAdmin.sol` also responsible for upgrading our contracts. When you run `zos upgrade` command, it goes through ProxyAdmin contract's [`upgrade`](https://docs.zeppelinos.org/docs/2.2.0/upgradeability_ProxyAdmin.html#upgrade) method. The ProxyAdmin contract also provides another method [`getProxyImplementation`](https://docs.zeppelinos.org/docs/2.2.0/upgradeability_ProxyAdmin.html#getProxyImplementation) which returns the current implementation of a given proxy.

You can find your ProxyAdmin contract address in `zos.<network>.json` under the same name.

```console json
"proxyAdmin": {
   "address": <proxyAdmin-address>
}
```
The [`ProxyAdmin.sol`](https://github.com/zeppelinos/zos/blob/v2.2.0/packages/lib/contracts/upgradeability/ProxyAdmin.sol) comes with `zos-lib` package.

## [App.sol](https://github.com/OpenZeppelin/openzeppelin-sdk/blob/v2.0.0/packages/lib/contracts/application/App.sol)

The App contract is the project's main entry point. Its most important function is to manage your project's "providers". A provider is basically an Ethereum Package identified by a name at a specific version. For example, a project may track your application's contracts in one provider named "my-application" at version "0.0.1", an OpenZeppelin Contracts provider named "@openzeppelin/contracts-ethereum-package" at version "2.0.0", and a few other providers. These providers are your project's sources of on-chain logic.

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

When you upgrade one of your application's smart contracts, it is your application provider named "my-application" that is bumped to a new version, e.g. from "0.0.1" to "0.0.2". On the other hand, when you decide to use a new version of the OpenZeppelin Ethereum Package in your project, it is the "@openzeppelin/contracts-ethereum-package" provider which is now pointed at the "2.0.1" version of the package, instead of "2.0.0".

An Ethereum Package is defined by the `Package` contract, as we'll see next.

NOTE: Additionally the `App` contract also facilitates the creation of proxies, by conveniently wrapping around the `AdminUpgradeabilityProxy` contract. For more info on direct usage of proxies, please see [the low level usage section](low_level_contract).

## [Package.sol](https://github.com/OpenZeppelin/openzeppelin-sdk/blob/v2.0.0/packages/lib/contracts/application/Package.sol)

A `Package` contract tracks all the versions of a given Ethereum Package. Following the example above, one package could be the "application package" associated to the name "my-application" containing all the contracts for version "0.0.1" of your application, and all the contracts for version "0.0.2" as well. Alternatively, another package could be an Ethereum Package associated to the name "@openzeppelin/contracts-ethereum-package" which contains a large number of versions "x.y.z" each of which contains a given set of contracts.

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

## [ImplementationDirectory](https://github.com/OpenZeppelin/openzeppelin-sdk/blob/v2.0.0/packages/lib/contracts/application/ImplementationDirectory.sol)

A version's `contractAddress` is an instance of the `ImplementationDirectory` contract, which is basically a mapping of contract aliases (or names) to deployed implementation instances. Continuing the example, your project's "my-application" package for version "0.0.1" could contain a directory with the following contracts:

**Directory for version "0.0.1" of the "my-application" package**
* Alias: "MainContract", Implementation: "0x0B06339ad63A875D4874dB7B7C921012BbFfe943"
* Alias: "MyToken", Implementation: "0x1b9a62585255981c85Acec022cDaC701132884f7"

While version "0.0.2" of the "my-application" package could look like this:

**Directory for version "0.0.2" of the "my-application" package**
* Alias: "MainContract", Implementation: "0x0B06339ad63A875D4874dB7B7C921012BbFfe943"
* Alias: "MyToken", Implementation: "0x724a43099d375e36c07be60c967b8bbbec985dc8" <--- this changed

Notice how version "0.0.2" uses a new implementation for the "MyToken" contract.

Likewise, different versions of the "@openzeppelin/contracts-ethereum-package" Ethereum Package could contain different implementations for persisting aliases such as "ERC20", "ERC721", etc.

An `ImplementationDirectory` is a contract that adopts the `ImplemetationProvider` interface, which simply requires that for a given contract alias or name, the deployed address of a contract is provided. In this particular implementation of the interface, an `ImplementationDirectory` can be frozen, indicating that it will no longer be able to set or unset additional contracts and aliases.
This is helpful for making official releases of Ethereum Packages, where the immutability of the package is guaranteed.

Other implementations of the interface could provide contracts without such a limitation, which makes the architecture pretty flexible, yet secure.

## Overview

The following diagram illustrates the interface of the contracts of published Ethereum Packages:

![OpenZeppelin SDK 2.x UML](/img/zos2.png)
