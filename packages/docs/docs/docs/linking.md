---
id: linking
title: Linking OpenZeppelin contracts
---

In the [first](first) tutorial, we learned how to set up a new ZeppelinOS project, deploy a simple contract, and upgrade it. Now, we will build a more interesting project with multiple contracts, leveraging the [OpenZeppelin contracts package](https://github.com/OpenZeppelin/openzeppelin-eth). We will learn about **linking EVM packages**, and **writing upgradeable contracts**.

## What we will build

We will write a `TokenExchange` contract, that will allow any user to purchase an ERC20 token in exchange for ETH, at a fixed exchange rate. To do this, we will need not only a TokenExchange contract, but also an [ERC20 implementation](https://docs.openzeppelin.org/v2.3.0/tokens#erc20). Let's start by getting one, but before, make sure to initialize a new project as described [here](first#setting-up-your-project):

```console
mkdir token-exchange && cd token-exchange
npm init -y
npm install --save-dev zos
zos init
```

> Note: The full code for this project is available in our [Github repo](https://github.com/zeppelinos/zos/tree/v2.4.0/examples/linking-contracts).

## Linking the contracts EVM package

We will first get ourselves an ERC20 token. Instead of coding one from scratch, we will use the one provided by the [OpenZeppelin contracts EVM package](https://github.com/OpenZeppelin/openzeppelin-eth). An EVM package is a set of contracts set up to be easily included in a ZeppelinOS project, with the added bonus that the contracts' code _is already deployed in the Ethereum network_. This is a more secure code distribution mechanism, and also helps you save gas upon deployment.

<!-- TODO: Add guide on what is an EVM package behind the scenes, instead of linking to a blogpost -->

> Note: Check out [this article](https://blog.zeppelinos.org/open-source-collaboration-in-the-blockchain-era-evm-packages/)to learn more about EVM packages.

To link the OpenZeppelin contracts EVM package into your project, simply run the following:

```console
zos link openzeppelin-eth@2.2.0
```

This command will download the EVM package (bundled as a regular npm package), and connect it to your ZeppelinOS project. We now have all of OpenZeppelin contracts at our disposal, so let's create an ERC20 token!

> Note: Make sure you install `openzeppelin-eth` and not `openzeppelin-solidity`. The latter is set up for general usage, while `openzeppelin-eth` is tailored for being used with ZeppelinOS. This means that its contracts are [already set up to be upgradeable](writing_contracts#use-upgradeable-packages).

## Creating an ERC20 token

Let's deploy an ERC20 token contract to our development network. But first, make sure to install ganache if needed, and start a new instance:

```console
npm install --global ganache-cli
ganache-cli --deterministic
```

For setting up the token, we will be using the [StandaloneERC20 implementation](https://github.com/OpenZeppelin/openzeppelin-eth/blob/master/contracts/token/ERC20/StandaloneERC20.sol) provided by the OpenZeppelin package. We will _initialize_ the instance with the token metadata (name, symbol, and decimals), and mint a large initial supply for one of our accounts.

<!-- CODE: We need a command to retrieve the current accounts (#967) -->

> Note: Your available accounts are shown by ganache when you start the process. If you ran it with the `--deterministic` flag as instructed, then your first and default account will be `0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1`.

```console
$ zos create
? Pick a contract to instantiate: openzeppelin-eth/StandaloneERC20
? Pick a network: development
✓ Deploying openzeppelin-eth dependency to network
? Do you want to call a function on the instance after creating it?: Yes
? Select which function: * initialize(name: string, symbol: string, decimals: uint8, initialSupply: uint256, initialHolder: address, minters: address[], pausers: address[])
? name (string): MyToken
? symbol (string): MYT
? decimals (uint8): 18
? initialSupply (uint256): 100e18
? initialHolder (address): 0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1
? minters (address[]): 
? pausers (address[]): 
✓ Setting everything up to create contract instances
✓ Instance created at 0x2612Af3A521c2df9EAF28422Ca335b04AdF3ac66
```

Let's break down what we did in the command above. We first chose to create an instance of the `StandaloneERC20` contract from the `openzeppelin-eth` package we had linked before, and to create it in the local `development` network. We are then instructing the CLI to _initialize_ it with the initial values needed to set up our token. This requires us to choose the appropriate `initialize` function, and input all the required arguments. ZeppelinOS will then atomically create and initialize the new instance in a single transaction.

We now have a working ERC20 token contract in our development network. We can check that the initial supply was properly allocated by using the `balance` command. Make sure to use the address where your ERC20 token instance was created.

<!-- CODE: We need a way to refer to our own contracts by name (and to the local accounts as well!) -->

```console
$ zos balance --erc20 0x2612Af3A521c2df9EAF28422Ca335b04AdF3ac66
? Enter an address to query its balance: 0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1
? Pick a network: development
Balance: 100 MYT
```

Great! We can now write an exchange contract and connect it to this token when we deploy it.

<!-- We can split the following into a separate tutorial if this one becomes too long -->

## Writing the exchange contract

Our exchange contract will need to store the token contract address and the exchange rate in its state. We will set these values during initialization, when we deploy our contract.

In order to support contract upgrades, ZeppelinOS [does not allow the usage of Solidity's `constructor`s](pattern#the-constructor-caveat). Instead, we need to use _initializers_. An initializer is just a regular Solidity function, with an additional check to ensure that it can be called only once. To make coding initializers easy, ZeppelinOS provides a base `Initializable` contract, that includes an `initializer` modifier that takes care of this. You will first need to install the package that provides that contract:

```console
npm install zos-lib@2.4.0
```

Now, let's write our exchange contract using an _initializer_ to set its initial state:

```solidity
pragma solidity ^0.5.0;

// Import base Initializable contract
import "zos-lib/contracts/Initializable.sol";

// Import interface and library from OpenZeppelin contracts
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
$ zos create
✓ Compiled contracts with solc 0.5.9 (commit.e560f70d)
? Pick a contract to instantiate: TokenExchange
? Pick a network: development
✓ Contract TokenExchange deployed
? Do you want to call a function on the instance after creating it?: Yes
? Select which function: initialize(_rate: uint256, _token: address)
? _rate (uint256): 10
? _token (address): 0x2612Af3A521c2df9EAF28422Ca335b04AdF3ac66
Instance created at 0x26b4AFb60d6C903165150C6F0AA14F8016bE4aec
```

<!-- CODE: We need to extend the zos transfer command to support erc20s -->

Our exchange is almost ready! We only need to fund it, so it can send tokens to purchasers. Let's do that using the `send-tx` command, to transfer the full token balance from our own account to the exchange contract. Make sure to replace the recipient of the transfer with the `TokenExchange` address you got from the previous command.

```console
$ zos send-tx
? Pick a network: development
? Choose an instance: StandaloneERC20 at 0x2612Af3A521c2df9EAF28422Ca335b04AdF3ac66
? Select which function: transfer(to: address, value: uint256)
? to (address): 0x26b4AFb60d6C903165150C6F0AA14F8016bE4aec
? value (uint256): 10e18
Transaction successful: 0x5863c8a8e122fcda7c6234abc6e60fad3f5a8108a3f88e2d8a956b63dbc222c2
Events emitted: 
 - Transfer
    from: 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1, 
    to: 0x26b4AFb60d6C903165150C6F0AA14F8016bE4aec, 
    value: 10000000000000000000
```

All set! We can start playing with our brand new token exchange.

## Using our exchange

Now that we have initialized our exchange contract initialized, and seeded it with funds, we can test it out by purchasing tokens. Recall from our contract that the purchase is made automatically when we send ETH to the contract, so let's try it by using `zos transfer`, sending funds to the `TokenExchange` instance address:

```console
$ zos transfer
? Pick a network: development
? Choose the account to send transactions from: (1) 0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0
? Enter the receiver account: 0x26b4AFb60d6C903165150C6F0AA14F8016bE4aec
? Enter an amount to transfer 0.1 ether
✓ Funds sent. Transaction hash: 0xc85a8caa161110ba7f08134f4496a995968a5aff7ae60ad9b6ce1c824e13cacb
```

<!-- Code: We need a method to easily go through the addresses of deployed contracts -->

> Note: Make sure you replace the receiver account with the corresponding address where your `TokenExchange` was created.

We can now use `zos balance` again, to check the token balance of the address that made the purchase. Since we sent 0.1 ETH, and we used a 1:10 exchange rate, we should see a balance of 1 MYT (MyToken).

```console
$ zos balance --erc20 0x5f8e26fAcC23FA4cbd87b8d9Dbbd33D5047abDE1
? Enter an address to query its balance: 0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0
? Pick a network: development
Balance: 1 MYT
```

Success! We have our exchange up and running, gathering ETH in exchange for our tokens. But how can we collect the funds we earned...?

## Upgrading the exchange

We forgot to add a method to withdraw the funds from the token exchange contract! While this would typically mean that the funds are locked in there forever, we can upgrade the contract with ZeppelinOS to add a way to collect those funds.

> Note: While upgrading a contract is certainly useful in situations like this, where you need to fix a bug or add a missing feature, it could still be used to change the rules of the game. For instance, you could upgrade the token exchange contract to alter the rate at any time. Because of this, it is important to have a proper [upgrades governance mechanism](upgrades_governance) in place.

Let's modify the `TokenExchange` contract to add a `withdraw` method, only callable by an `owner`.

```solidity
contract TokenExchange is Initializable {
  uint256 public rate;
  IERC20 public token;
  address public owner;

  function withdraw() public {
    require(msg.sender == owner);
    msg.sender.transfer(address(this).balance);
  }

  // (existing functions not shown here for brevity)
}
```

When modifying your contract, make sure to add the `owner` variable **after** the others ([here](writing_contracts#modifying-your-contracts) you can see why this restriction). Don't worry if you forget about it, the CLI will check this for you when you try to upgrade.

> Note: If you are familiar with OpenZeppelin contracts, you may be wondering why we didn't simply extend from `Ownable` and used the `onlyOwner` modifier. The fact is ZeppelinOS does not support modifying the contracts you extend from (if they declare their own state variables). Again, the CLI will alert you if you attempt to do this. See [here](writing_contracts#modifying-your-contracts) for more info. 

The only thing missing is actually _setting_ the `owner` of the contract. To do this, we can add another function that we will call when upgrading, making sure it can only be called once:

```solidity
contract TokenExchange is Initializable {
  uint256 public rate;
  IERC20 public token;
  address public owner;

  function withdraw() public {
    require(msg.sender == owner);
    msg.sender.transfer(address(this).balance);
  }

  // To be run during upgrade, ensuring it can never be called again
  function setOwner(address _owner) public {
    require(owner == address(0));
    owner = _owner;
  }

  // (existing functions not shown here for brevity)
}
```

We can now upgrade our token exchange contract to this new version. We will call `setOwner` during the upgrade process. ZeppelinOS will take care of making the upgrade and the call atomic, all in a single transaction.

```console
$ zos upgrade
? Pick a network: development
✓ Compiled contracts with solc 0.5.9 (commit.e560f70d)
- New variable 'address owner' was added in contract TokenExchange in contracts/TokenExchange.sol:1 at the end of the contract.
✓ Contract TokenExchange deployed
? Which proxies would you like to upgrade?: Choose by name
? Pick a contract to upgrade: TokenExchange
? Do you want to call a function on the instance after upgrading it?: Yes
? Select which function: setOwner(_owner: address)
? _owner (address): 0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1
✓ Instance upgraded at 0x26b4AFb60d6C903165150C6F0AA14F8016bE4aec.
```

There! We can now call `withdraw` from our default address to extract all ETH sent to the exchange.

```console
$ zos send-tx
? Pick a network: development
? Pick an instance: TokenExchange at 0xD86C8F0327494034F60e25074420BcCF560D5610
? Select which function: withdraw()
✓ Transaction successful. Transaction hash: 0xc9fb0d3ada96ec4c67c1c8f1569f9cfaf0ff0f7b241e172b32a023b1763ab7ab
```

> Note: You can also upgrade contracts from an EVM package. Upon a new release of openzeppelin-eth, if you want to update your ERC20 to include the latest fixes, you can just `zos link` the new version and use `zos upgrade` to get your instance to the newest code.

## Wrapping up

We have built a more complex setup in this tutorial, and learned several concepts along the way. We introduced [EVM packages](https://blog.zeppelinos.org/open-source-collaboration-in-the-blockchain-era-evm-packages/) as dependencies for our projects, allowing us to spin up a new token with little effort. We also presented some [limitations](writing_contracts) of the [upgrades pattern](pattern) that ZeppelinOS uses, such as [initializer methods](writing_contracts#initializers) as a replacement for constructors, or [preserving the storage layout](writing_contracts#modifying-your-contracts) when modifying our source code. We also learned how to run a function as a migration when upgrading a contract.

Feel free to explore the rest of the guides in the site to keep learning more, or start coding with ZeppelinOS right away!

