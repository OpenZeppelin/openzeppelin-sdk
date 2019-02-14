---
id: version-2.2.0-new_2.2
title: What's new in ZeppelinOS 2.2
original_id: new_2.2
---

In this section, you'll find everything you need to know if you're coming from ZeppelinOS 2.0 or 2.1 and want to start using 2.2.

## ProxyAdmin

As of version 2.2, ZeppelinOS projects use at least one contract for their on-chain architecture. On previous versions of ZeppelinOS (2.0 and 2.1), regular projects contained no on-chain architecture at all, and EVM packages contained a few supporting contracts (other than your own contracts). More info on these contracts can be found in the [Contracts architecture](https://docs.zeppelinos.org/docs/architecture.html) section of the documentation. The idea behind having no on-chain architecture for regular projects was to keep them as minimalistic as possible in terms of deployed code; everything else was managed off-chain by the ZeppelinOS CLI. The only deployed code was your own code.

However, the [transparent proxy pattern](https://docs.zeppelinos.org/docs/pattern.html#transparent-proxies-and-function-clashes) caused some confusion when interacting with proxies. Basically, you would get errors whenever you tried to interact with the proxy of a contract from the account that created the proxy.

To solve this, ZeppelinOS 2.2 introduces the [ProxyAdmin](https://github.com/zeppelinos/zos/blob/v2.0.0/packages/lib/contracts/upgradeability/ProxyAdmin.sol) contract, which basically becomes the admin of all the proxies you create, and allows you to interact with them normally from any account. Yes, this means that regular ZeppelinOS 2.2 projects will have some on-chain architecture around them, but it is minimal, and exists with the sole purpose of making your life easier.

## Migrating from ZeppelinOS 2.0 or 2.1 to ZeppelinOS 2.2

If you created a project using ZeppelinOS 2.0 or 2.1, and then decided to upgrade your ZeppelinOS dependency to 2.2, you need to create and set up a ProxyAdmin contract for each of the networks your project is deployed to. Good news tho! This can be done automatically by using the ZeppelinOS CLI.

To trigger the migration in a particular network, you need to start a session in it (or use the `--network myNetwork` parameter) and use any of the following commands: `create`, `update`, `set-admin`, or `publish`. The CLI will prompt if you want to migrate your deployment on that specific network you are interacting with, and will set up the ProxyAdmin contract automatically.

So go ahead and say yes, and the CLI will take care of the rest, so that you are up to date with the latest release of ZeppelinOS!

## Web3 1.0.0-beta.37

ZeppelinOS 2.2 deprecated Web3 0.x and switched to Web3 1.x. This means that whenever ZeppelinOS is used programmatically, be it via the `zos-lib` library or tests, it will now return Web3 1.x contract objects. Please refer to the [official web3.js 1.0 documentation](https://web3js.readthedocs.io/en/1.0/latest/), particularly to the [web3.eth.Contract section](https://web3js.readthedocs.io/en/1.0/web3-eth-contract.html) to see how these objects differ from the old contract objects.

## Typescript

ZeppelinOS 2.2 was completely re-written in Typescript. This makes not only ZeppelinOS's code, but also the code of projects built on top of ZeppelinOS, easier to read, easier to maintain and more robust as a whole. Typescript is a typed superset of Javascript that compiles to plain Javascript. For more information, please refer to [the Typescript documentation](http://www.typescriptlang.org/docs/home.html). 

## Changelog

Please see the project's changelogs for more information:
- [cli](https://github.com/zeppelinos/zos/blob/master/packages/cli/changelog.md)
- [lib](https://github.com/zeppelinos/zos/blob/master/packages/lib/changelog.md)
