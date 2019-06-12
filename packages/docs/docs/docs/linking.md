---
id: linking
title: Linking OpenZeppelin contracts
---

In the [first](first) tutorial, we learned how to set up a new ZeppelinOS project, deploy a simple contract, and update it. Now, we will build a more interesting project with multiple contracts, leveraging the [OpenZeppelin contracts package](https://github.com/OpenZeppelin/openzeppelin-eth). We will learn about **linking EVM packages**, and **writing upgradeable contracts**.

## What we will build

We will write a `TokenExchange` contract, that will allow any user to purchase an ERC20 token in exchange for ETH, at a fixed exchange rate. To do this, we will need not only a TokenExchange contract, but also an [ERC20 implementation](https://docs.openzeppelin.org/v2.3.0/tokens#erc20). Let's start by getting one, but before, make sure to initialize a new project as described [here](first#setting-up-your-project):

```console
mkdir token-exchange && cd token-exchange
npm init -y
npm install --save-dev zos ganache-cli
npx zos init
```

> Note: The full code for this project is available in our [Github repo](https://github.com/zeppelinos/zos/tree/v2.4.0/examples/linking-contracts).

## Linking the contracts EVM package

We will first get ourselves an ERC20 token. Instead of coding one from scratch, we will use the one provided by the [OpenZeppelin contracts EVM package](https://github.com/OpenZeppelin/openzeppelin-eth). An EVM package is a set of contracts set up to be easily included in a ZeppelinOS project, with the added bonus that the contracts' code _is already deployed in the Ethereum network_. This is a more secure code distribution mechanism, and also helps you save gas upon deployment.

<!-- TODO: Add guide on what is an EVM package behind the scenes, instead of linking to a blogpost -->

> Note: Check out [this article](https://blog.zeppelinos.org/open-source-collaboration-in-the-blockchain-era-evm-packages/)to learn more about EVM packages.

To link the OpenZeppelin contracts EVM package into your project, simply run:

```console
npx zos link openzeppelin-eth@2.2.0
```

This command will download the EVM package (bundled as a regular npm package), and connect it to your ZeppelinOS project. We now have all of OpenZeppelin contracts at our disposal, so let's create an ERC20 token!

## Creating an ERC20 token

Let's deploy an ERC20 token contract to our development network. Make sure to start ganache first:
```console
ganache-cli -p 9545 -d
```

For setting up the token, we will be using the [StandaloneERC20 implementation](https://github.com/OpenZeppelin/openzeppelin-eth/blob/master/contracts/token/ERC20/StandaloneERC20.sol) provided by the OpenZeppelin package. We will _initialize_ the instance with the token metadata (name, symbol, and decimals), and minting a large initial supply for one of our accounts.

<!-- CODE: We need a command to retrieve the current accounts (#967) -->

> Note: Your available accounts are shown by ganache when you start the process. If you ran it with the `-d` flag as instructed, then your first and default account will be `0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1`.

```console
$ npx zos create
? Choose a contract: openzeppelin-eth/StandaloneERC20
? Select a network from the network list: local
? Do you want to run a function after creating the instance?: Yes
? Select a method: [Initializable] initialize(name: string, symbol: string, decimals: uint8, initialSupply: uint256, initialHolder: address, minters: address[], pausers: address[])
? name: MyToken
? symbol: MYT
? decimals: 18
? initialSupply: 100000000000000000000
? initialHolder: 0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1
? minters:
? pausers:
Instance created at 0x2612Af3A521c2df9EAF28422Ca335b04AdF3ac66
```

Done! We have a working ERC20 token contract in our development network. Note that, when creating this instance, we chose to _initialize_ it with the initial values needed to set up our token. ZeppelinOS allows us to atomically call any function during the creation of a contract if we need to.

We can check that the initial supply was properly allocated by using the `balance` command. Make sure to use the address where your token instance was created.

<!-- CODE: We need a way to refer to our own contracts by name (and to the local accounts as well!) -->

```console
$ npx zos balance --erc20 0x2612Af3A521c2df9EAF28422Ca335b04AdF3ac66
? Enter an address to query its balance: 0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1
? Select a network from the network list: local
Balance: 100 MYT
```

Great! We can now write an exchange contract and connect it to this token when we deploy it.

<!-- We can split the following into a separate tutorial if this one becomes too long -->

## Writing the exchange contract

Our exchange contract will need to store the token contract address and the exchange rate in its state. We will set these values during initialization, when we deploy our contract.

In order to support contract upgrades, ZeppelinOS does not allow the usage of Solidity's `constructor`s. Instead, we need to use _initializers_. An initializer is just a regular Solidity function, with an additional check to ensure that it can be called only once. To make coding initializers easy, ZeppelinOS offers a base `Initializable` contract, that ships with an `initializer` modifier that takes care of this. You will need first to install the package that provides that contract:

```console
npm install zos-lib@2.4.0
```

Now, let's write our exchange contract using an _initializer_ to receive its initial state:

```solidity
pragma solidity ^0.5.0;

import "zos-lib/contracts/Initializable.sol";
import "openzeppelin-eth/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-eth/contracts/math/SafeMath.sol";

contract TokenExchange is Initializable {
  using SafeMath for uint256;

  // Contract state: exchange rate and token
  uint256 public rate;
  IERC20 public token;

  // Initializer function (replaces constructor)
  function initialize(uint256 _rate, IERC20 _token) public initializer {
    rate = _rate;
    token = _token;
  }

  // Send tokens back to the sender using predefined exchange rate
  function() external payable {
    uint256 tokens = msg.value.mul(rate);
    token.transfer(msg.sender, tokens);
  }
} 
```

Note the usage of the `initializer` modifier in the `initialize` method. This guarantees that, after we have deployed our contract, no one can call into that function again to alter the token or the rate.

Let's now create and initialize our new `TokenExchange` contract:

```console
$ npx zos create
? Choose a contract: TokenExchange
? Select a network from the network list: local
? Do you want to run a function after creating the instance?: Yes
? Select a method: initialize(_rate: uint256, _token: address)
? _rate: 10
? _token: 0x2612Af3A521c2df9EAF28422Ca335b04AdF3ac66
Instance created at 0x26b4AFb60d6C903165150C6F0AA14F8016bE4aec
```

<!-- CODE: We need to extend the zos transfer command to support erc20s -->

Our exchange is almost ready! We only need to fund it, so it can send tokens to purchasers. Let's do that using the `send-tx` command, to transfer the full token balance from our own account to the exchange contract. Make sure to replace the recipient of the transfer with the `TokenExchange` address you got from the previous command.

```console
$ npx zos send-tx
? Select a network from the network list: local
? Choose an instance: StandaloneERC20 at 0x2612Af3A521c2df9EAF28422Ca335b04AdF3ac66
? Select a method: transfer(to: address, value: uint256)
? to: 0x26b4AFb60d6C903165150C6F0AA14F8016bE4aec
? value: 100000000000000000000
Transaction successful: 0x5863c8a8e122fcda7c6234abc6e60fad3f5a8108a3f88e2d8a956b63dbc222c2
Events emitted: 
 - Transfer(from: 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1, to: 0x26b4AFb60d6C903165150C6F0AA14F8016bE4aec, value: 100000000000000000000)
```

TODO:
- Make a purchase with send-tx, and verify token balance of purchaser
- Note that there is no way to extract funds, and update the contract
- Mention updating EVM packages
- Summary