---
id: first
title: Your first project
---

This tutorial will get you started using the OpenZeppelin SDK. We will create a new project with a simple contract, deploy it to a development network, interact with it from the terminal, and then upgrade it.

## Prerequisites

The OpenZeppelin SDK is bundled as an [npm package](https://npmjs.com/package/@openzeppelin/cli). We will need [node.js](https://nodejs.org/) to install and run it. Head over to [its website](https://nodejs.org/) for instructions on how to install it.

> Note: At the moment, the OpenZeppelin SDK does not support node 12. Make sure to install version 10.

Once you have installed `node`, you can install the OpenZeppelin SDK CLI:

```console
npm install --global @openzeppelin/cli
```

> Note: We are installing the CLI [globally](https://docs.npmjs.com/downloading-and-installing-packages-globally) in our workstation. Alternatively, you can install it [local](https://docs.npmjs.com/downloading-and-installing-packages-locally) to each project by running `npm install --save-dev @openzeppelin/cli` in your project folder. This would require you to run every command by prefixing it with `npx`. Installing it locally allows you to have different `openzeppelin` versions in different projects, but requires you to reinstall every time you start a new project.

## Setting up your project

We'll first create a node.js project in a new directory. Head over to a terminal and run:

```console
mkdir my-project
cd my-project
npm init -y
```

Let's now use the CLI to initialize a OpenZeppelin SDK project:

```console
openzeppelin init
```

The CLI will prompt you to choose a project name and version, defaulting to the ones from the `package.json`, and then set up a few files and folders for running your OpenZeppelin project.

We are now ready to begin coding.

> Note: Should you get lost at any point during this tutorial, you can refer to the full code for this project in our [`Github repo`](https://github.com/OpenZeppelin/openzeppelin-sdk/tree/v2.4.0/examples/first-project).

## Your first contract

We will write a simple contract in [Solidity](https://solidity.readthedocs.io/), the most popular language for Ethereum smart contracts. Create a new file `contracts/Counter.sol` in your project with the following content:

```solidity
pragma solidity ^0.5.0;

contract Counter {
  uint256 public value;
  
  function increase() public {
    value++;
  }
}
```

This contract will just keep a numeric `value`, that will be increased by one every time we send a transaction to the `increase()` function.

You can run `openzeppelin compile` to compile the contract and check for any errors. After it compiled successfully, we can now deploy our contract.

> Note: You don't have to worry if you forget to compile your contract. The CLI will automatically check if your contract changed when you run any command, and compile it if needed.

## Deploying to a development network

We will use [ganache](https://truffleframework.com/ganache) as a _development network_ to deploy our contract. If you don't have ganache installed, do so now by running `npm install -g ganache-cli`.

Development networks are mini blockchains that run just on your computer, and are much faster than the actual Ethereum network. We will use one for coding and testing.

Open a separate terminal, and start a new ganache process:

```console
ganache-cli --deterministic
```

This will start a new development network, using a deterministic set of accounts, instead of random ones. We can now deploy our contract there, running `openzeppelin create`, and choosing to deploy the `Counter` contract to the `development` network.

```console
$ openzeppelin create
✓ Compiled contracts with solc 0.5.9 (commit.e560f70d)
? Pick a contract to instantiate: Counter
? Pick a network: development
✓ Added contract Counter
✓ Contract Counter deployed
? Do you want to call a function on the instance after creating it?: No
✓ Setting everything up to create contract instances
✓ Instance created at 0xCfEB869F69431e42cdB54A4F4f105C19C080A601
```

> Note: The addresses where your contracts are created, or the transaction identifiers you see, may differ from the ones listed here.

Our counter contract is deployed to the local development network and ready to go! We can test it out by interacting with it from the terminal. Let's try incrementing the counter, by sending a transaction to call the `increase` function through `openzeppelin send-tx`.

```console
$ openzeppelin send-tx
? Pick a network: development
? Pick an instance: Counter at 0xCfEB869F69431e42cdB54A4F4f105C19C080A601
? Select which function: increase()
✓ Transaction successful. Transaction hash: 0x20bef6583ea32cc57fe179e34dd57a5494db3c403e441624e56a886898cb52bd
```

We can now use `openzeppelin call` to query the contract's public `value`, and check that it was indeed increased from zero to one.

```console
$ openzeppelin call
? Pick a network: development
? Pick an instance: Counter at 0xCfEB869F69431e42cdB54A4F4f105C19C080A601
? Select which function: value()
✓ Method 'value()' returned: 1
```

<!-- We could move the following to a separate tutorial -->
## Upgrading your contract

We will now modify our `Counter` contract to make the `increase` function more interesting. Instead of increasing the counter by one, we will allow the caller to increase the counter by any value. Let's modify the code in `contracts/Counter.sol` to the following:

```solidity
pragma solidity ^0.5.0;

contract Counter {
  uint256 public value;
  
  function increase(uint256 amount) public {
    value += amount;
  }
}
```

We can now upgrade the instance we created earlier to this new version:

```console
$ openzeppelin upgrade
? Pick a network: development
✓ Compiled contracts with solc 0.5.9 (commit.e560f70d)
✓ Contract Counter deployed
? Which proxies would you like to upgrade?: All proxies
Instance upgraded at 0xCfEB869F69431e42cdB54A4F4f105C19C080A601.
```

Done! Our `Counter` instance has been upgraded to the latest version, and neither its address nor its state have changed. Let's check it out by increasing the counter by ten, which should yield eleven, since we had already increased it by one:

```console
$ openzeppelin send-tx
? Pick a network: development
? Pick an instance: Counter at 0xCfEB869F69431e42cdB54A4F4f105C19C080A601
? Select which function: increase(amount: uint256)
? amount (uint256): 10
Transaction successful: 0x9c84faf32a87a33f517b424518712f1dc5ba0bdac4eae3a67ca80a393c555ece

$ openzeppelin call
? Pick a network: development
? Pick an instance: Counter at 0xCfEB869F69431e42cdB54A4F4f105C19C080A601
? Select which function: value()
Returned "11"
```

> Note: If you are curious about how the OpenZeppelin SDK achieves this feat, given that smart contracts are immutable, check out our [upgrades pattern guide](pattern). You will see that there are some changes that are not supported during upgrades. For instance, you cannot [remove or change the type of a contract state variable](writing_contracts#modifying-your-contracts). Nevertheless, you can change, add, or remove all the functions you want.

That's it! You now know how to start a simple OpenZeppelin project, create a contract, deploy it to a local network, and even upgrade it as you develop. Head over to the next tutorial to learn how to interact with your contract from your code.