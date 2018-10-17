---
id: migrate_from_1.x_to_2.x
title: Migrating from 1.x to 2.x
---

In this section, we'll tell you everything you need to know if you're coming from ZeppelinOS 1.x and want to start using 2.x.

## Terminology and fundamentals

2.x's most fundamental change is that it expands on zOS's linking features. In 1.x, you were able to link your projects to what used to be called an "on-chain standard library". This "stdlib" was basically a pre-deployed version of OpenZeppelin, which gave your projects instant access to hundreds of standard implementations without having to compile or deploy any code. This proved to be a very powerful, innovative concept, but we realized that it could be taken much further... In 1.x, you could connect to different versions of this "standard library" but there was just this one "standard library" that your application could use. 2.x takes this to a whole new level; you can now connect your project to multiple "standard libraries", but that's not all, this makes the entire concept of what used to be a "standard library" evolve to the concept of an "EVM package".

What is an EVM package? It is basically a piece of reusable code that has been deployed to the blockchain in the form of EVM bytecode. Anyone can create an EVM package, and your zOS projects will be able to connect to a vast ecosystem of pre-compiled, pre-deployed reusable in the form of EVM packages.

Similarly, as we realized what an EVM package was, we realized what it's not. In 1.x, your zOS project's contracts were always managed by two contracts: App and Package. This made your contracts upgradeable and gave them the ability to link to EVM packages (see [Contract Architecture](https://docs.zeppelinos.org/docs/architecture.html)). We realized that these two contracts made sense when it came to EVM packages, but didn't when it came to parts of your project that weren't meant to be reusable code, i.e. code that just needed to be upgradeable. And so, in 2.x, upgradeability, and the ability to link to EVM packages were completely separated.

By default, your zOS project will not use any of its App or Package on-chain architecture unless you explicitly state that your code is meant to be reusable as an EVM package. When you init a zOS project, there is no architecture other than your project's architecture. ZeppelinOS simply uses the CLI to manage proxies for you. Now, if you intend your project to be a reusable EVM package, you can `publish` your code, and the CLI will seamlessly deploy the necessary App and Package architecture which will allow your code to exist as a discoverable deployed EVM package.

## New commands

2.x introduces a few new commands to its CLI:

* `zos publish`
* `zos check`
* `zos set-admin`
* `zos unlink`

#### Publish

```
Usage: publish --network <network> [options]

publishes your project to the selected network

Options:
  -n, --network <network>  network to be used
  -f, --from <from>        specify transaction sender address
  --timeout <timeout>      timeout in seconds for each blockchain transaction (defaults to 600s)
  -h, --help               output usage information
```

As explained in the ["Terminology and fundamentals" section](https://docs.zeppelinos.org/docs/migrate_from_1.x_to_2.x.html#terminology-and-fundamentals), this command is what transforms your project to a reusable EVM package. It introduces deploys the App and Package architecture and ensures that your code is discoverable as an EVM package.

Once a project is published, it can be treated as a regular zOS project, i.e. you can still add/remove contracts to it, make updates, push your changes to the blockchain, etc, the only difference is that you can now use the `bump` command to update your EVM package as a whole.

NOTE: Despite the similarities between EVM packages and NPM packages, in zOS you just need to publish your packages once, after that, bumping a package is enough to update it. In NPM, a package needs to be bumped locally and then published each time the changes are to become public.

#### Check

```
Usage: check [contract] [options]

checks your contracts for potential issues

Options:
  --skip-compile  skips contract compilation
  -h, --help      output usage information
```

As discussed in the ["Safety checks" part of the documentation](https://docs.zeppelinos.org/docs/advanced.html#safety-checks), the zOS CLI performs a series of safety checks on your contracts as sub-routines of some of it's commands. the new `check` command allows you to perform this checks in a standalone manner.

#### Set-admin

```
Usage: set-admin [alias-or-address] [new-admin-address] --network <network> [options]

change upgradeability admin of a contract instance. Provide the [alias] or [package]/[alias] of the contract to change the ownership of all its instances, or its [address] to change a single one. Note that if you transfer to an incorrect address, you may irreversibly lose control over upgrading your contract.

Options:
  -y, --yes                accept transferring admin rights (required)
  -n, --network <network>  network to be used
  -f, --from <from>        specify transaction sender address
  --timeout <timeout>      timeout in seconds for each blockchain transaction (defaults to 600s)
  -h, --help               output usage information
```

Convenience command that allows you to change the address that can perform upgrades on a proxy.

#### Unlink

```
Usage: unlink [dependencyName1 ... dependencyNameN]

unlinks libraries from the project. Provide a list of whitespace-separated library names

Options:
  --push [network]     push all changes to the specified network
  --skip-compile       skips contract compilation
  -f, --from <from>    specify the transaction sender address for --push
  --timeout <timeout>  timeout in seconds for each blockchain transaction (defaults to 600s)
  -h, --help           output usage information
```

Opposite to the `link` command.

## Modified commands

In 2.x, there are minor changes to the commands from 1.x, like some of them now having options like `--skip-compile`, but there are also more signiffcant changes.

*`bump`* is now only relevant for published EVM packages, and is no longer applicable to projects that are not intended for reusability.

*`link`* can now be called for multiple EVM packages.

*`init`* no longer has the `--lib` option.

## Compatibility

Unfortunately, 2.x introduces breaking changes, so a project that was started with 1.x cannot be upgraded to 2.x. This means that if you upgrade your global `zos` NPM package to 2.x, it won't be compatible with projects that were created using the old version of `zos`. In such cases, the CLI will detect the incompatibility and warn you. This is one of the reasons why `npx zos` is recommended over `zos` usage, so that each NPM project can target its own `zos` version.

#### Changes to your contracts

When it comes to Solidity code, there is nothing special you need to consider when using zOS 2.x other than using initializers instead of constructors. For more info on this, see the ["Initializers vs constructors"](https://docs.zeppelinos.org/docs/advanced.html#initializers-vs-constructors) section of the documentation.

As with 1.x, zOS 2.x will manage all upgradeability and package linking features without you having to any use of special Solidity syntax. In this sense, zOS is language agnostic.

#### Compatible EVM packages

Also, note that EVM packages created with 1.x cannot be linked to projects using 2.x. All EVM package providers will need to create new packages so that they can be used in zOS 2.x projects.
