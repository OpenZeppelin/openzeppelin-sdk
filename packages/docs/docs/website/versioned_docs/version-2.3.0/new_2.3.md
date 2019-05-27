---
id: version-2.3.0-new_2.3
title: What's new in ZeppelinOS 2.3
original_id: new_2.3
---

Here you will find all the major new features shipped in version 2.3. Check out the changelog for a more detailed list of what has changed since 2.2.

## Interactive commands

Most `zos` CLI commands will now prompt for any information they need to work, and guide you through the whole process. This is a major improvement over version 2.2, where you needed to specify all arguments and options along with the command, or get an error back.

Commands are also much better at fulfilling steps for you. In version 2.2, you would need to follow these steps to add a contract to your project, push it to a network, and then create and initialize a new instance:

```
$ zos add MyContract
$ zos push --network mainnet
$ zos create MyContract --network mainnet --init initialize --args 42
> Instance created at 0x123456
```

Starting on version 2.3, you can just run `zos create` instead, and the CLI will guide you through the entire contract creation and initialization process.

All previous arguments and flags still work. However, if you are writing a script to run in an automated environment, you can also add a `--no-interactive` flag to any command to make sure it will never prompt, or set a global `ZOS_NON_INTERACTIVE` environment variable. The CLI will also honor the `DEBIAN_FRONTEND=noninteractive` variable.

## New unpack command

A new command `zos unpack` was added for unpacking a zepkit instance. We are providing two packs initially: 
- `zos unpack zepkit` will initialize a new barebones react app, preconfigured with OpenZeppelin, ZeppelinOS, Truffle, and Infura, ready to start coding.
- `zos unpack tutorial` will initialize the same pack, but with an additional guided tutorial for you to get acquainted with it.

Additionally, `zos unpack` can be directed to any github repository with a `kit.json` specification, so anyone in the community can propose their own packs to be used with ZeppelinOS.

## Improved set-admin command

In previous versions, `zos set-admin` would allow you to change the upgradeability admin (ie the Ethereum account, contract or externally owned, that had the rights to upgrade an instance) of each individual proxy in your application. However, on version 2.2, we introduced the `ProxyAdmin` component, which is a small contract that acts as a the owner of all your instances for your project (which you own in turn).

We have updated the `zos set-admin` command to take advantage of this new contract. It now allows you to change ownership of your entire project to a different account in a single transaction, by just changing the owner of the root `ProxyAdmin`. The functionality from previous versions is maintained, meaning that you can still change ownership of any individual instances if needed.

## New CREATE2 command

`CREATE2` is an EVM opcode that allows you to deploy a contract at a predictable address, by providing a _salt_ that is used to compute the deployment address. We have added experimental support for this feature in version 2.3, where you can query the deployment address for a contract before creating it, and then execute the deployment when you are ready:

```
$ zos create2 --salt 42 --query
> Instance using salt 823 will be deployed at 0x123456
...
$ zos create2 MyContract --salt 42 --init initialize
> Instance of MyContract deployed at 0x123456
```

We have also added early meta-transaction support for this command. Instead of having the deployment address determined by the salt and the sender of the transaction, now a user can _sign_ a `CREATE2` request for a specific contract with a salt, and have the transaction submitted by anyone.

```
$ zos create2 MyContract --query --salt 42 --signature 0xabcdef --init initialize
> Instance of MyContract initialized with 'initialize()' with salt 42 and signature 0xabcdef will be deployed at 0x654321
...
$ zos create2 MyContract --salt 42 --signature 0xabcdef --init initialize
> Instance of MyContract deployed at 0x654321
```

## Changelog

Please see the project's changelogs for more information:
- [cli](https://github.com/zeppelinos/zos/blob/release/2.3/packages/cli/changelog.md)
- [lib](https://github.com/zeppelinos/zos/blob/release/2.3/packages/lib/changelog.md)
