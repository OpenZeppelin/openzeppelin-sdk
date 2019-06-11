---
id: first
title: Your first project
---

This tutorial will get you started using ZeppelinOS. We will create a new project with a simple contract, deploy it to a development network, interact with it from the terminal, and then update it.

## Prerequisites

ZeppelinOS is bundled as an [npm package](https://npmjs.com/package/zos). We will need [node.js](https://nodejs.org/) to install and run it. Head over to [its website](https://nodejs.org/) for instructions on how to install it.

> Note: At the moment, ZeppelinOS does not support node 12. Make sure to install version 10.

## Setting up your project

We'll first create a node.js project in a new directory. Head over to a terminal and run:

```console
mkdir my-project
cd my-project
npm init -y
```

Now that we have a clean `package.json`, install the ZeppelinOS CLI:

```console
npm install --save-dev zos
```

> Note: We are installing the CLI locally to the project, which means that we will run every command as `npx zos`. Alternatively, you can also install it globally using `npm install --global zos`, and drop the `npx` from every command.

And use the CLI to initialize a ZeppelinOS project:

```console
npx zos init
```

The CLI will prompt you to choose a project name and version, defaulting to the ones from the `package.json`, and then set up a some files for running your ZeppelinOS project. 

We are now ready to begin coding.

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

You can run `npx zos compile` to compile the contract and check for any errors. After it compiled successfully, we can now deploy our contract.

## Deploying to a development network

We will use [ganache](https://truffleframework.com/ganache) as a _development network_ to deploy our contract. If you don't have ganache installed, do so now by running `npm install -g ganache-cli`.

Development networks are mini blockchains that run just on your computer, and are much faster than the actual Ethereum network. We will use one for coding and testing.

Open a separate terminal, and start a new ganache process:

```console
ganache-cli -p 9545 -d
```

This will start a new development network on port 9545, where ZeppelinOS defaults to for local development. We can now deploy our contract there, running `npx zos create`, and choosing to deploy the `Counter` contract to the `local` network.

```console
$ npx zos create
? Choose a contract: Counter
? Select a network from the network list: local
? Do you want to run a function after creating the instance? No
Instance created at 0xCfEB869F69431e42cdB54A4F4f105C19C080A601
```

> Note: The addresses where your contracts are created, or the transaction identifiers you see, may differ from the ones listed here.

Our counter contract is deployed to the local network and ready to go! We can test it out by interacting with it from the terminal. Let's try incrementing the counter, by sending a transaction to call the `increase` function through `npx zos send-tx`.

```console
$ npx zos send-tx
? Select a network from the network list: local
? Choose an instance: Counter at 0xCfEB869F69431e42cdB54A4F4f105C19C080A601
? Select a method: increase()
Transaction successful: 0x1993a8b6774ce05f2f2da0c5fc1174de46a3630e642fac81cf71bec28864e451
```

We can now use `npx zos call` to query the contract's public `value`, and check that it was indeed increased from zero to one.

```console
$ npx zos call
? Select a network from the network list: local
? Choose an instance: Counter at 0x9561C133DD8580860B6b7E504bC5Aa500f0f06a7
? Select a method: value()
Returned "1"
```

<!-- We could move the following to a separate tutorial -->
## Updating your contract

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

We can now update the instance we created earlier to this new version:

```console
$ npx zos update
? Select a network from the network list: local
? Which proxies would you like to upgrade? All proxies
Instance at 0xCfEB869F69431e42cdB54A4F4f105C19C080A601 upgraded
```

Done! Our `Counter` instance has been updated to the latest version, and neither its address nor its state have changed. Let's check it out by increasing the counter by ten, which should yield eleven, since we had already increased it by one:

```console
$ zos-dev send-tx
? Select a network from the network list: local
? Choose an instance: Counter at 0xCfEB869F69431e42cdB54A4F4f105C19C080A601
? Select a method: increase(amount: uint256)
? amount: 10
Calling increase with: 
 - amount (uint256): "10"
Transaction successful: 0x9c84faf32a87a33f517b424518712f1dc5ba0bdac4eae3a67ca80a393c555ece

$ zos-dev call
? Select a network from the network list: local
? Choose an instance: Counter at 0xCfEB869F69431e42cdB54A4F4f105C19C080A601
? Select a method: value()
Returned "11"
```

Note: If you are curious about how ZeppelinOS achieves this feat, given that smart contracts are immutable, check out our [upgrades pattern guide](pattern).

That's it! You now know how to start a simple ZeppelinOS project, create a contract, deploy it to a local network, and even update it as you develop. Head over to the next tutorial to learn how to interact with your contract from your code.