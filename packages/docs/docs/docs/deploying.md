---
id: deploying
title: Deploying your first project
---

The following steps will get you started using ZeppelinOS.

## Installation

First, let's install [Node.js](http://nodejs.org/) and
[npm](https://npmjs.com/). On their
respective websites you will find specific instructions for your machine.

Then, install ZeppelinOS running:

```console
npm install --global zos
```

Run `zos --help` to get a list of all the ZeppelinOS commands. At any time
during this guides when we introduce a new command, run
`zos <command-name> --help` to get more information about that command and
its arguments.

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

Now, we can initialize the ZeppelinOS project:

```console
zos init my-project
```

This command will create a `zos.json` file, which contains all the information
about the project. For details about this file format, please see the
[configuration files](configuration.md#zosjson) page.

The command will also initialize [Truffle](https://truffleframework.com/), so
by now, inside the `my-project` directory you should have a `package.json` file
(created by `npm`), two empty directories named `contracts` and `migrations`, 
a `truffle-config.js` file (created by `zos` for Truffle), and a 
`zos.json` file (created by `zos` for ZeppelinOS).

## Adding a contract

Let's create a very simple contract as an example to be added to the project.
Name it `MyContract.sol`, and put it in the `contracts` folder with the
following Solidity code:

```solidity
pragma solidity ^0.4.24;

import "zos-lib/contracts/Initializable.sol";

contract MyContract is Initializable {

  uint256 public x;

  function initialize(uint256 _x) initializer public {
    x = _x;
  }
}
```

Notice that our sample contract has an `initialize` function instead of the
standard Solidity constructor. This is required by ZeppelinOS if you want to
upgrade your contract later, which we'll see in more detail in the next
guide.

But before we get there, we still need a couple of steps. This contract
imports another contract from the `zos-lib` package, so we have to install it:

```console
npm install zos-lib
```

Now we can add the contract to the project:

```console
zos add MyContract
```

This command will first compile `MyContract`, and then it will add it to the
project writing it in the `zos.json` configuration file.

## Deploying your project

And just like that, we are now ready to make the initial deployment of the
project. We are just missing a blockchain network where it will be deployed.
For this example, let's use Truffle's local development network. To start it,
open a separate terminal and run:

```console
npx truffle develop --network local
```

And back in the original terminal:

```console
zos push --network local
```

This command deploys `MyContract` to the specified network. If your project added other 
contracts (using the `add` command) they would be deployed as well. An important thing 
to understand is that the contracts deployed by the `push` command are implementation 
or logic contracts and are not intended to be used directly, rather to be used by 
upgradeable instances, as we will see later in the 
[Upgrading your project](https://docs.zeppelinos.org/docs/upgrading.html) section.

The `push` command also creates a `zos.dev-<network_id>.json` file with all the 
information about your project in this specific network, including the addresses of the 
deployed contract implementations in `contracts["MyContract"].address`.  
You can read more about this file format in the 
[configuration files](configuration.md#zos-network-json) section.

Note that if a previous `zos.dev-<network_id>.json` was already created, the `push` 
command will just update said file with your last changes. For example, if you 
change the source of `MyContract` and call `zos push` again, 
ZeppelinOS will deploy a new version of the contract implementation for `MyContract` 
and replace the entry in the json file's `contracts["MyContract"].address`. 

You can follow the same steps to deploy your project to mainnet or other test
networks by just replacing `local` with the network name from your
`truffle-config.js` file. This is further explained in the
[Deploying to mainnet](mainnet) guide.

But for now, let's continue exploring the ZeppelinOS features! The initial
version of our project exists in the blockchain. Next, we will learn how to
upgrade it.
