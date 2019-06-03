---
id: deploying
title: Deploying your first project
---

The following steps will get you started using ZeppelinOS.

## Install Node and NPM

First, install [Node.js](http://nodejs.org/) and [npm](https://npmjs.com/). On the respective websites you will find specific instructions for installation on your computer.

## Setting up your project

Create a directory for your project and navigate into it:

```console
mkdir my-project
cd my-project
```

Use `npm` to create a `package.json` file:

```console
npm init
```

This command will ask you for details about the project. For this getting started project, just press **Enter** to accept the default values for each field.

Then install ZeppelinOS in your project folder by running:

```console
npm install zos@2.3.0-rc.2
```

Run `npx zos --version` to output the current ZeppelinOS version.

Run `npx zos --help` to output a list of all ZeppelinOS commands available. At any time
during this getting started tutorial, you can run `npx zos <command-name> --help` to get detailed information about that command and its arguments.

The contract in this tutorial imports a contract from the ZeppelinOS library package, which includes contracts to help with the development of ZeppelinOS compatible smart contracts. Install the `zos-lib` package as follows:

```console
npm install zos-lib@2.3.0-rc.2
```

For this tutorial, you import `Initializable.sol` so your contract can use the `initializer` modifier, and thus prevent the `initialize` function from being called more than once.

Now initialize the ZeppelinOS project:

```console
npx zos init my-project
```

This command will create a `zos.json` file, which contains all the information
about the project related to ZeppelinOS. For details about this file format, see
[Configuration Files](configuration.md#zosjson).

At this point, the `my-project` directory should also contain:
* A `package.json` file created by `npm init`
* Directories named `node_modules`, `contracts`, and `migrations` (the last two are empty) 
* A `truffle-config.js` file (created by the `zos` CLI for Truffle)

You will also need to install [Truffle](https://truffleframework.com/):

```console
npm install truffle@5.0.4
```

Now your project is set up to use ZeppelinOS!


## Adding a contract

Let's create a very simple example contract to add to the project. Name it `MyContract.sol`
and put it in the `contracts` folder with the following Solidity code:

```solidity
pragma solidity ^0.5.0;

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

Notice that the sample contract has an `initialize` function instead of the standard
Solidity constructor. This is how you define constructor functionality for upgradeable
contracts in ZeppelinOS, which you'll see in more detail in the next tutorial.

Also note that the contract imports another contract from the `zos-lib` package, which
you installed previously.


## Deploying your project

You're now ready for the initial deployment of the project. To do this, however, you'll need a blockchain network on which to deploy it. For this example, you can use [Ganache](https://truffleframework.com/docs/ganache/quickstart), which is a personal blockchain for Ethereum development that you can use to deploy your contracts. To install it, run:

```console
npm install -g ganache-cli
```

Open a separate terminal and run Ganache:

```console
ganache-cli --port 9545 --deterministic
```

Now run `zos create`:

```console
$ npx zos create
```

Most of the ZeppelinOS commands, such as `create`, are interactive as of version 2.3 and will prompt you for the needed information. In this case, the `create` command will prompt you, and you can use **Enter** to select the defaults as follows:

`Choose a contract:` **MyContract**
`Select a network:` **local**
`Do you want to run a function after creating the instance?` **Y**
`Select a method:` **initialize**

When it prompts you for initial variable values, you can give it any **int** and **string** such as:

`_x`: **42**
`_s`: **hitchhiker**

The interactive command does the following:

* Invokes `create` to compile your contract.

  > **Note**: The current version of ZeppelinOS relies on Truffle to compile contracts and
  > determine the Solidity compiler version to use. If you want to use a different version,
  > specify it in the Truffle configuration file. You can find more information in the
  > Truffle documentation at:
  > https://github.com/trufflesuite/truffle/releases/tag/v5.0.0-beta.0#specify-a-solcjs-version

* Invokes `add` to add your contract to the project by registering it in the `zos.json` configuration file.

* Invokes `push` to deploy the contract to the `local` network. If your project had contained other contracts, they would also be deployed.

### Pushing contracts

The `push` command creates a file `zos.dev-<network_id>.json` containing all the information about the project in the specified network. The file includes the address of the deployed contract implementation in `contracts.<contract-name>.address`. For more details about this file format, see
[Configuration Files](configuration.md#zos-network-json).

If you had already created a previous `zos.dev-<network_id>.json` file, `push` would simply update that file with your latest changes. For example, if you change the source of `MyContract` and call `zos push` again, ZeppelinOS will deploy a new version of `MyContract` and replace the entry in the json file's `contracts["MyContract"].address`.

It's important to understand that the contracts deployed by `push` are logic contracts and are not intended to be used directly. For example, you wouldn't interact with the MyContract.sol contract that you just deployed. It's only intended for defining the behavior or logic of the contract. As the next tutorial explains, what you do is create an upgradeable instance for the logic contract, and interact with this instance instead.

Once you create an upgradeable instance of your contract, you always interact with the same instance, even if you decide to upgrade it and define a new logic contract for it. The `create` command will return the address of the upgradeable contract instance, but you can also find it in the `zos.dev-<network_id>.json` file under `proxies.my-project.MyContract`. Always interact with this proxy address, and never with the address of the logic contract.

You can follow the same steps to deploy your project to mainnet or other test networks by simply replacing `local` with the network name from your `truffle-config.js` file. This is further explained in [Deploying to mainnet](mainnet).

Let's continue exploring all the features that ZeppelinOS has to offer! The initial version of your project exists in the blockchain. In the next tutorial you'll learn how to create an upgradeable instance for the logic contract.

Next: [Upgrading your project](https://docs.zeppelinos.org/docs/upgrading.html)