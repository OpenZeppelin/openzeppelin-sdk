---
id: version-2.1.0-new_2
title: What's new in ZeppelinOS 2.0
original_id: new_2
---

In this section, you'll find everything you need to know if you're coming from ZeppelinOS 1.x and want to start using 2.x.

## Terminology and fundamentals

2.x's most fundamental change is that it expands on ZeppelinOS's linking features. In 1.x, you were able to link your projects to what used to be called an "on-chain standard library". This "stdlib" was basically a pre-deployed version of a set of common reusable contracts, like OpenZeppelin, which gave your projects instant access to hundreds of standard implementations without having to compile or deploy any code whatsoever. This proved to be a very powerful, innovative concept, but we realized that it could be taken much further. In 1.x, you could connect to different versions of this "standard library" but there was just this ONE "standard library" that your application could link to. 2.x takes this to a whole new level; you can now connect your project to multiple "standard libraries", but that's not all, this makes the entire concept of what used to be a "standard library" evolve to the concept of an "EVM package".

What is an EVM package? It is basically a piece of reusable code that has been deployed to the blockchain in the form of EVM bytecode. Anyone can create an EVM package, and your ZeppelinOS projects will be able to connect to a vast ecosystem of pre-compiled, pre-deployed reusable code in the form of EVM packages.

Similarly, as we realized what an EVM package was, we realized what it's not. In 1.x, your ZeppelinOS project's contracts were always managed by a package contract. This made your contracts upgradeable and gave them the ability to link to EVM packages (see [Contract architecture](architecture.md) for more info). We realized that this made sense when it came to EVM packages, but didn't when it came to parts of your project that weren't meant to be reusable code, i.e. code that just needed to be upgradeable but not reusable. And so, in 2.x, upgrades, and the ability to link to EVM packages were completely separated.

In 2.x by default, your ZeppelinOS project will not use any of its App or Package on-chain architecture unless you explicitly state that your code is meant to be reusable as an EVM package. When you init a ZeppelinOS project, there is no architecture other than your project's code. ZeppelinOS simply uses the CLI to manage proxies for you. Now, if you intend your project to be a reusable EVM package, you can run `zos publish` on your project, and the CLI will seamlessly deploy the necessary contracts which will allow your code to exist as an EVM package.

## New commands

2.x introduces a few new commands to its CLI:

* [`zos publish`](cli_publish.md)
* [`zos check`](cli_check.md)
* [`zos set-admin`](cli_set-admin.md)
* [`zos unlink`](cli_unlink.md)

In order to read more information about these commands, please run `zos <command> --help` or go to the 
[commands reference](apis.md) section.

## Modified commands

In 2.x, there are minor changes to the commands from 1.x, like some of them now having options like `--skip-compile`, but there are also more significant changes.

*[`bump`](cli_bump.md)* is now only relevant for published EVM packages, and is no longer applicable to projects that are not intended for reusability.

*[`link`](cli_link.md)* can now be called with multiple EVM packages as arguments.

*[`init`](cli_init.md)* no longer has the `--lib` option. Now all the ZeppelinOS projects are packages, and you can call the `zos publish` command to make your EVM package reusable by others.

## Compatibility

Unfortunately, 2.x introduces breaking changes, so a project that was created using 1.x cannot be automatically upgraded to 2.x. This means that if you upgrade your global `zos` npm package to 2.x, it won't be compatible with projects that were created using the old version of `zos`. In such cases, the CLI will detect the incompatibility and warn you. This is one of the reasons why `npx zos` is recommended over `zos` usage, so that each npm project can target its own `zos` version.

## Changes to your contracts

When it comes to Solidity code, there is nothing special you need to consider when using ZeppelinOS 2.x other than using initializers instead of constructors. For more info on this, see the ["the constructor caveat"](pattern.md#the-constructor-caveat) section of the documentation.

As with 1.x, ZeppelinOS 2.x will manage upgrades and package linking without you having to use any special Solidity syntax.

On 2.x, the `Migratable` contract has been deprecated, and we are shifting to a much simpler flavour of `Initializable`.

## Compatible EVM packages

Also, note that EVM packages created with 1.x cannot be linked to projects using 2.x. All EVM package providers will need to create new packages with 2.x so that they can be used in ZeppelinOS 2.x projects. Again, the CLI will warn you when you attempt to link an incompatible package.
