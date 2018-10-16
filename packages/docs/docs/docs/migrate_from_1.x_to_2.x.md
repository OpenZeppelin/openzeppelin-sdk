---
id: migrate_from_1.x_to_2.x
title: Migrating from 1.x to 2.x
---

In this section, we'll tell you everything you need to know if you're coming from ZeppelinOS 1.x and want to start using 2.x.

## Terminology and Fundamentals

2.x's most fundamental change is that it expands on zOS's linking features. In 1.x, you were able to link your projects to what used to be called an "on-chain standard library". This "stdlib" was basically a pre-deployed version of OpenZeppelin, which gave your projects instant access to hundreds of standard implementations without having to compile or deploy any code. This proved to be a very powerful, innovative concept, but we realized that it could be taken much further... In 1.x, you could connect to different versions of this "standard library" but there was just this one "standard library" that your application could use. 2.x takes this to a whole new level; you can now connect your project to multiple "standard libraries", but that's not all, this makes the entire concept of what used to be a "standard library" evolve to the concept of an "EVM package".

What is an EVM package? It is basically a piece of reusable code that has been deployed to the blockchain in the form of EVM bytecode. Anyone can create an EVM package, and your zOS projects will be able to connect to a vast ecosystem of pre-compiled, pre-deployed reusable in the form of EVM packages.

Similarly, as we realized what an EVM package was, we realized what it's not. In 1.x, your zOS project's contracts were always managed by two contracts: App and Package. This made your contracts upgradeable and gave them the ability to link to EVM packages (TODO: add link to architecture section). We realized that these two contracts made sense when it came to EVM packages, but didn't when it came to parts of your project that weren't meant to be reusable code, i.e. code that just needed to be upgradeable. And so, in 2.x, upgradeability, and the ability to link to EVM packages were completely separated.

By default, your zOS project will not use any of its App or Package on-chain architecture unless you explicitly state that your code is meant to be reusable as an EVM package. When you init a zOS project, there is no architecture other than your project's architecture. ZeppelinOS simply uses the CLI to manage proxies for you. Now, if you intend your project to be a reusable EVM package, you can `publish` your code, and the CLI will seamlessly deploy the necessary App and Package architecture which will allow your code to exist as a discoverable deployed EVM package.

## New Commands
TODO

## Modified Commands
TODO

## Compatibility
TODO

### Changes to your Contracts
TODO

### Compatible EVM Packages
TODO
