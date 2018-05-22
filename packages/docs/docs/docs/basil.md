---
id: basil
title: Zeppelin's Basil
sidebar_label: Basil
---

Here at the Zeppelin headquarters we have a basil plant. She is a good mascot, always green, always faithful. For reasons unknown, we found that she enjoys a lot being under a light that changes color; so of course we got her the best multicolor LED bulb we could find.

![The Basil](https://pbs.twimg.com/media/DdL2qciX4AEMeoR.jpg "The basil")

However, after a few days we started having conflicts. Who gets the honor to set the light color for our friendly plant? What if they choose their favorite color instead of the one that's best for the plant? For how long do they get to keep their chosen color? We also found that somebody kept resetting the color back to an ugly lime green every morning. We are ok with anarchy, but we want transparency, so we have just decided to control the light bulb through a contract on the Ethereum blockchain.

## Creating a Dapp with ZeppelinOS

In this guide, we will build a simple dapp on top of ZeppelinOS. To see the end product, please visit:
* Source code: [zeppelinos/basil](https://github.com/zeppelinos/basil)
* Dapp: [basil.zeppelin.solutions](https://basil.zeppelin.solutions)

First we will need to [install Node.js following the instructions from their website](https://nodejs.org/en/download/package-manager/). Then, let's set up a directory for our project and initialize the npm package:

```sh
mkdir basil
cd basil
npm init --yes
```

## The sample contract

Next, let's write the contract to control the light bulb in `contracts/Basil.sol`:

```sol
pragma solidity ^0.4.21;

import "openzeppelin-zos/contracts/ownership/Ownable.sol";

/**
 * @title Basil
 */
contract Basil is Ownable {

  // color
  uint256 public r;
  uint256 public g;
  uint256 public b;

  // highest donation in wei
  uint256 public highestDonation;

  event Withdrawal(address indexed wallet, uint256 value);
  event NewDonation(address indexed donor, uint256 value, uint256 r, uint256 g, uint256 b);

  function donate(uint256 _r, uint256 _g, uint256 _b) public payable {
    require(_r < 256);
    require(_g < 256);
    require(_b < 256);
    require(msg.value > highestDonation);

    r = _r;
    g = _g;
    b = _b;
    highestDonation = msg.value;
    NewDonation(
      msg.sender, msg.value,
      r, g, b);
  }

  function withdraw(address wallet) public onlyOwner {
    require(this.balance > 0);
    require(wallet != address(0));
    uint256 value = this.balance;
    wallet.transfer(value);
    Withdrawal(wallet, value);
  }
}
```

The contract is super simple. If somebody wants to set the light color, they have to make a donation. If the donation is higher than the previous one, it is accepted, the light color changes and an event is emitted. Of course, a withdraw method allows the Zeppelin team to collect all donations, which are safely put away in the plant's own education fund.

We need to install the `openzeppelin-zos` dependency and to compile the contract:

```sh
npm install openzeppelin-zos
npx truffle compile
```

NOTE: If you're familiar with the `openzeppelin-solidty` library, not that we're not using it here. We're using `openzeppelin-zos` library, which is the OpenZeppelin version that is compatible with ZeppelinOS.

## Using ZeppelinOS

Now, to get the niceties that ZeppelinOS provides, let's install the `zos` command line interface and initialize our application with the version 0.0.1:

```sh
npm install zos
zos init basil 0.0.1
```

This will create a `zos.json` file where ZeppelinOS will keep track of
the contracts of your application.

Next, let's add the implementation of our Basil contract:

```sh
zos add Basil
```

To have your `zos.json` file always up-to-date, run `zos add` for every
new contract you add to your project.

By now, the json files looks like this:

```json
{
  "name": "Basil",
  "version": "0.0.1",
  "contracts": {
    "Basil": "Basil"
  }
}
```

OpenZeppelin will use this file to track your project's contracts on chain, making them upgradeable and dynamically linkable to pre-deployed libraries, as well see soon.

## Deploying our first version of Basil, locally

Let's start a local ethereum network:

```sh
ganache-cli --deterministic
```

This will print 10 accounts. Copy the address of the first one, and then back into the initial terminal, export it as the `OWNER` because it will be useful for us later:

```sh
export OWNER=<address>
```

Then, to deploy our app:

```sh
zos push --from $OWNER --network local
```

The first time you run this command for a specific network, a new
`zos.<network>.json` will be created. This file will reflect the status
of your project in that specific network, including contract deployed addresses, versions, contract proxies, etc.

## Proxies

Notice how the file `zos.local.json` lists a series of "contracts" and "proxies". The first represent implementations for a specific contract name, while the second represent the actual proxies that people will interact with in the blockchain. 

A proxy is a wrapper for an implementation, that allows it to be updated, while mainting it's state. We need to create a proxy for Basil.

```sh
zos create Basil --from $OWNER --network local --init --args $OWNER
```

Take a look at `zos.local.json` again. You will see that we now have a proxy for Basil. This is the address to use in a Dapp.

## Upgrading the contract

If we ever found a bug in Basil, we would need to upgrade our zos package, provide a new implementation for Basil with a fix and tell our proxy to upgrade to the new implementation. This would preserve all the previous donation history, while seamlessly patching the bug.

Another common thing that happens when developing smart contracts for Ethereum is that new standards appear, all the new kids implement them in their contracts, and a very cool synergy between contracts starts to happen. The people who have immutable contracts already deployed will miss all the fun. This has just happened to us: it would be very nice to encourage donations to Basil by emitting a unique ERC721 token in exchange. Well, let's upgrade the contract with ZeppelinOS to do just that.

We could modify `contracts/Basil.sol`. But now let's try something else. Let's make a new contract in `contracts/BasilERC721.sol`, that inherits from our initial version of Basil:

```sol
pragma solidity ^0.4.21;

import "./Basil.sol";
import "openzeppelin-zos/contracts/token/ERC721/MintableERC721Token.sol";
import "openzeppelin-zos/contracts/math/SafeMath.sol";

contract BasilERC721 is Basil {
  using SafeMath for uint256;

  // ERC721 non-fungible tokens to be emitted on donations.
  MintableERC721Token public token;
  uint256 public numEmittedTokens;

  function setToken(MintableERC721Token _token) external onlyOwner {
    require(_token != address(0));
    require(token == address(0));
    token = _token;
  }

  function donate(uint256 _r, uint256 _g, uint256 _b) public payable {
    super.donate(_r, _g, _b);
    emitUniqueToken(tx.origin);
  }

  function emitUniqueToken(address _tokenOwner) internal {
    token.mint(_tokenOwner, numEmittedTokens);
    numEmittedTokens = numEmittedTokens.add(1);
  }
}
```

A few things to note:
  * This new version extends from the previous one. This is a very handy pattern, because the proxy used in ZeppelinOS requires new versions to preserve the state variables.
  * We can add new state variables and new functions. The only thing that we can't do on a contract upgrade is to remove state variables.

Let's create a new version of our app, to hold the new contracts:

```sh
zos bump 0.0.2
```

Let's add this version to our ZeppelinOS application and push to the network again:

```sh
truffle compile
zos add BasilERC721:Basil
zos push --from $OWNER --network local
```

This will print the address of the deployed Basil contract. Let's export this value to use it later:

```sh
export BASIL_ADDRESS=<address>
```

Now, to upgrade our proxy:

```sh
zos upgrade Basil --from $OWNER --network local
```

By now, Basil's proxy will use the new implementation, but it will revert on every donation because it's token is not set. We'll do that next.

## Connecting to OpenZeppelin's standard library

So far, we've used ZeppelinOS to seamlessly upgrade our app's contracts. We will now use it to create a proxy for a pre-deployed ERC721 token implementation.

The first thing we need to do, is tell our app to link to the `openzeppelin-zos` standard library release:

```sh
zos link openzeppelin-zos
zos push --from $OWNER --deploy-stdlib --network local
```

Notice the `--deploy-stdlib` option we've used. What this does is inject a version of the standard lib in our development network. Since we're working on a local blockchain, ZeppelinOS's contracts don't exist. This handy option solves that problem for us quite conveniently ^^

Now, to create a proxy for the token:

```sh
zos create MintableERC721Token --from $OWNER --init --args \"$BASIL_ADDRESS\",\"BasilToken\",\"BSL\" --network local
```

This command will output the token's new proxy address. Lets use it to set it in our new BasilERC721 version:

```sh
export TOKEN_ADDRESS=<address>
echo "BasilERC721.at(\"$BASIL_ADDRESS\").setToken(\"$TOKEN_ADDRESS\", {from: \"$OWNER\"})" | truffle console --network local
```

That's it! Now you know how to use ZeppelinOS to develop upgradeable apps. Have a look at the scripts `deploy/deploy_with_cli_v1.sh` and `deploy/deploy_with_cli_v2.sh` to review what we've gone over in the guide.

Stay tuned for more advanced turorials!
