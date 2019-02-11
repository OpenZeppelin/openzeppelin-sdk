---
id: deploying
title: Deploying your first project
---

The following steps will get you started using ZeppelinOS.

## Install Node and NPM

First, let's install [Node.js](http://nodejs.org/) and
[npm](https://npmjs.com/). On their
respective websites you will find specific instructions for your machine.

## Setting up your project

We'll need to create a directory for our project and access it:

```console
mkdir my-project
cd my-project
```

Use `npm` to create a `package.json` file:

```console
npm init
```

This command will ask you for details about the project. For this very basic
guide you can just press enter to accept the default values of each field.

Then, install ZeppelinOS in your project folder by running:

```console
npm install zos
```

Run `npx zos --help` to get a list of all the ZeppelinOS commands available. At any time
during these guides, when we introduce a new command, run
`npx zos <command-name> --help` to get more information about that command and
its arguments.

Now, we can initialize the ZeppelinOS project:

```console
npx zos init my-project
```

This command will create a `zos.json` file, which contains all the information
about the project related to ZeppelinOS. For details about this file format see the
[configuration files](configuration.md#zosjson) page.

The command will also initialize [Truffle](https://truffleframework.com/), so
by now, inside the `my-project` directory you should have a `package.json` file
(created by `npm`), two empty directories named `contracts` and `migrations`,
a `truffle-config.js` file (created by the `zos` CLI for Truffle), and a
`zos.json` file (created by `zos` for ZeppelinOS).

Next, we need to install Truffle. To do so, run the following command:

```console
npm install truffle@4.1.15 --save
```

> Note: We are specifically installing Truffle 4.1.15, as ZeppelinOS 2.1 only supports Truffle 5 for command-line usage (not programmatic usage). Full support for Truffle 5 and Web3 1.0 will be released in ZeppelinOS 2.2._

That's it! Our project is now fully set up for using ZeppelinOS.

## Adding a contract

Let's create a very simple contract as an example to be added to the project.
Name it `MyContract.sol`, and put it in the `contracts` folder with the
following Solidity code:

```solidity
pragma solidity ^0.4.24;

import "zos-lib/contracts/Initializable.sol";

contract MyContract is Initializable {

  uint256 public x;
  string public s;

  function initialize(uint256 _x, string memory _s) initializer public {
    x = _x;
    s = _s;
  }
}
```

Notice that our sample contract has an `initialize` function instead of the
standard Solidity constructor. This is the way to define constructor
functionality for upgradeable contracts in ZeppelinOS, which we'll see in
more detail in the next guide.

But before we get there, we still need a couple of steps. This contract
imports another contract from the `zos-lib` package, so we have to install it:

```console
npm install zos-lib
```

`zos-lib` is the ZeppelinOS library, which includes contracts to help with the
development of ZeppelinOS compatible smart contracts. In this case, we are importing
`Initializable.sol` in order to use the `initializer` modifier, which will
prevent the `initialize` function from be called more than once.

Now we can add the contract to the project:

```console
npx zos add MyContract
```

This command will first compile `MyContract`, and then it will add it to the
project registering it in the `zos.json` configuration file.

> **Note**: The current version of ZeppelinOS relies on Truffle to compile contracts and
> determine the Solidity compiler version to use. If you want to use a different version, please specify it
> in the Truffle configuration file.
> More info:
> https://github.com/trufflesuite/truffle/releases/tag/v5.0.0-beta.0#specify-a-solcjs-version

## Deploying your project

And just like that, we are now ready to make the initial deployment of the
project. We are just missing a blockchain network where it will be deployed.
For this example, let's use [ganache](https://truffleframework.com/docs/ganache/quickstart),
a personal blockchain for Ethereum development that you can use to develop
your contracts. To install it run:

```console
npm install -g ganache-cli
```

To start working with it, open a separate terminal and run:

```console
ganache-cli --port 9545 --deterministic
```

Once we have done that, let's go back to the original terminal and
run the following command:

```console
npx zos session --network local --from 0x1df62f291b2e969fb0849d99d9ce41e2f137006e --expires 3600
```

The `session` command starts a session to work with a desired network.
In this case, we are telling it to work with the `local` network with the
`--network` option, and also setting a default sender address for the
transactions we will run with the `--from` option. Additionally, the
`expires` flag allows us to indicate the session expiration time in seconds.

> Note that we are using a specific address for the `--from` option which
is different to the default address that `ganache-cli` would use.
This is because we need to use different addresses in order to create
upgradeable contracts and to query them. You can read more about it in the
[ZeppelinOS upgrades pattern section](pattern.md).

Now that everything has been setup, we are ready to deploy the project.
To do so simply run:

```console
npx zos push
```

This command deploys `MyContract` to the specified network and prints its
address. If your project added other
contracts (using the `add` command) they would be deployed as well.

The `push` command also creates a `zos.dev-<network_id>.json` file with all the
information about your project in this specific network, including the addresses of the
deployed contract implementations in `contracts["MyContract"].address`.
You can read more about this file format in the
[configuration files](configuration.md#zos-network-json) section.

If a previous `zos.dev-<network_id>.json` was already created, the `push`
command will just update said file with your last changes. For example, if you
change the source of `MyContract` and call `zos push` again,
ZeppelinOS will deploy a new version of `MyContract`
and replace the entry in the json file's `contracts["MyContract"].address`.

An important thing
to understand is that the contracts deployed by the `push` command are logic contracts and are not intended to be used directly, rather to be used by
upgradeable instances, as we will see later in the
[Upgrading your project](https://docs.zeppelinos.org/docs/upgrading.html) section.

You can follow the same steps to deploy your project to mainnet or other test
networks by just replacing `local` with the network name from your
`truffle-config.js` file. This is further explained in the
[Deploying to mainnet](mainnet) guide.

But for now, let's continue exploring all the features that ZeppelinOS has to offer! The initial
version of our project exists in the blockchain. Next, we will learn how to
upgrade it.
