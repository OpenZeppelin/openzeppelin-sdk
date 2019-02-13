---
id: new_2.2
title: What's new in ZeppelinOS 2.2
---

## ProxyAdmin

As of version 2.2, ZeppelinOS projects use at least one contract for their on-chain architecture. On previous versions of ZeppelinOS (2.0 and 2.1), regular projects contained no on-chain architecture at all, and EVM packages contained a few supporting contracts (other than your own contracts). More info on these contracts can be found in the [Contracts architecture](https://docs.zeppelinos.org/docs/architecture.html) section of the documentation. The idea behind having no on-chain architecture for regular projects was to keep them as minimalistic as possible in terms of deployed code; everything else was managed off-chain by the ZeppelinOS CLI. The only deployed code was your own code.

However, the [transparent proxy pattern](https://docs.zeppelinos.org/docs/pattern.html#transparent-proxies-and-function-clashes) caused some confusion when interacting with proxies. Basically, you would get errors whenever you tried to interact with the proxy of a contract from the account that created the proxy.

To solve this, ZeppelinOS 2.2 introduces the [ProxyAdmin](https://github.com/zeppelinos/zos/blob/v2.0.0/packages/lib/contracts/upgradeability/ProxyAdmin.sol) contract, which basically becomes the admin of all the proxies you create, and allows you to interact with them normally from any account. Yes, this means that regular ZeppelinOS 2.2 projects will have some on-chain architecture around them, but it is minimal, and exists with the sole purpose of making your life easier.

## Migrating from ZeppelinOS 2.0 or 2.1 to ZeppelinOS 2.2

If you created a project using ZeppelinOS 2.0 or 2.1, and then decided to upgrade your ZeppelinOS dependency to 2.2, you need to create and set up a ProxyAdmin contract for each of the networks your project is deployed to. Good news tho! This can be done automatically by using the ZeppelinOS CLI.

To trigger the migration in a particular network, you need to start a session in it (or use the `--network myNetwork` parameter) and use any of the following commands: `create`, `update`, `set-admin`, or `publish`. The CLI will prompt if you want to migrate your deployment on that specific network you are interacting with, and will set up the ProxyAdmin contract automatically.

So go ahead and say yes, and the CLI will take care of the rest, so that you are up to date with the latest release of ZeppelinOS!
